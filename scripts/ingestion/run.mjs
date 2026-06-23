// ============================================================
// Rent a Pro — Directory Ingestion Pipeline
// ============================================================
// Fetches experts from a source, normalizes them with Claude,
// and upserts them into the directory_experts table.
//
// SETUP:
//   1. Add to .env.local:
//        ANTHROPIC_API_KEY=sk-ant-...        (required)
//        GOOGLE_PLACES_API_KEY=AIza...       (required for --source google-places)
//   2. Make sure supabase/schema.sql has been re-run so the
//      directory_experts + leads tables exist.
//
// USAGE:
//   # Pull tutors from Google Places in a city (add --dry-run to preview first)
//   node scripts/ingestion/run.mjs --source google-places --category tutoring --city "Los Angeles, CA" --dry-run
//   node scripts/ingestion/run.mjs --source google-places --category tutoring --city "Los Angeles, CA"
//
//   # Import from a CSV / JSON file
//   node scripts/ingestion/run.mjs --source csv --file ./my-tutors.csv --category tutoring --dry-run
//   node scripts/ingestion/run.mjs --source csv --file ./my-tutors.csv --category tutoring
//
// CATEGORY SLUGS: tutoring | career-coaching | fitness | nutrition | cars | home | tech | ...
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { extractAndNormalize } from "./extract.mjs";
import { upsertListings } from "./upsert.mjs";
import { fetchGooglePlaces } from "./adapters/google-places.mjs";
import { loadFromFile } from "./adapters/csv.mjs";

// ---- load env ---------------------------------------------------------------

function loadEnv() {
  try {
    return Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2].trim()])
    );
  } catch {
    return {};
  }
}

// ---- arg parsing ------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : null;
  };
  return {
    source: get("--source") || "csv",
    category: get("--category") || "",
    city: get("--city") || "United States",
    file: get("--file"),
    maxResults: parseInt(get("--max") || "20", 10),
    dryRun: args.includes("--dry-run"),
    verbose: args.includes("--verbose"),
  };
}

// ---- main -------------------------------------------------------------------

async function main() {
  const args = parseArgs();
  const env = loadEnv();

  // Validate required env.
  if (!env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY missing from .env.local");
    process.exit(1);
  }
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env.local");
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Check the table exists.
  const { error: tableCheck } = await supabase.from("directory_experts").select("id").limit(1);
  if (tableCheck) {
    console.error("ERROR: directory_experts table not found.");
    console.error("  -> Run supabase/schema.sql in the Supabase SQL Editor first.");
    process.exit(1);
  }

  console.log(`\nRent a Pro Ingestion Pipeline`);
  console.log(`  source:   ${args.source}`);
  console.log(`  category: ${args.category || "(auto-detect)"}`);
  if (args.source === "google-places") console.log(`  city:     ${args.city}`);
  if (args.source === "csv") console.log(`  file:     ${args.file}`);
  console.log(`  dry-run:  ${args.dryRun}`);
  console.log("");

  // ---- Step 1: Fetch raw listings from the source --------------------------

  let rawListings = [];

  if (args.source === "google-places") {
    if (!env.GOOGLE_PLACES_API_KEY) {
      console.error("ERROR: GOOGLE_PLACES_API_KEY missing from .env.local");
      console.error("  -> Get one at https://console.cloud.google.com (free $200/mo credit)");
      process.exit(1);
    }
    const searchTerm = args.category.replace(/-/g, " ") || "professional services";
    console.log(`Searching Google Places: "${searchTerm} in ${args.city}" ...`);
    rawListings = await fetchGooglePlaces(searchTerm, args.city, env.GOOGLE_PLACES_API_KEY, args.maxResults);
    console.log(`  -> found ${rawListings.length} raw places\n`);
  } else if (args.source === "csv") {
    if (!args.file) {
      console.error("ERROR: --file <path> required for --source csv");
      process.exit(1);
    }
    console.log(`Loading from file: ${args.file} ...`);
    rawListings = loadFromFile(args.file, args.category);
    console.log(`  -> found ${rawListings.length} rows\n`);
  } else {
    console.error(`ERROR: Unknown source "${args.source}". Use: google-places | csv`);
    process.exit(1);
  }

  if (rawListings.length === 0) {
    console.log("No listings found. Done.");
    return;
  }

  // ---- Step 2: Extract + normalize with Claude -----------------------------

  console.log(`Normalizing with Claude (${rawListings.length} listings) ...\n`);
  const extracted = [];
  let i = 0;

  for (const raw of rawListings) {
    i++;
    process.stdout.write(`  [${i}/${rawListings.length}] extracting ...`);

    const normalized = await extractAndNormalize(raw._raw, args.source, anthropic);

    if (!normalized) {
      console.log(" skipped (not a valid expert)");
      continue;
    }

    // Merge source metadata from the adapter.
    const listing = {
      ...normalized,
      source: args.source,
      source_url: raw._sourceUrl,
      website_url: normalized.website_url || raw._websiteUrl || null,
      public_phone: normalized.public_phone || raw._phone || null,
      public_email: normalized.public_email || raw._email || null,
    };

    // If CSV provided explicit category slugs, use them as a hint (Claude can override).
    if (raw._categoryHint?.length > 0 && listing.category_slugs.length === 0) {
      listing.category_slugs = raw._categoryHint;
    }

    if (args.verbose) {
      console.log(` ok: ${listing.display_name} [${listing.category_slugs.join(", ")}]`);
    } else {
      console.log(` ok: ${listing.display_name}`);
    }

    extracted.push(listing);

    // Brief pause between Claude calls to be polite.
    if (i < rawListings.length) await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n  ${extracted.length} valid listings extracted, ${rawListings.length - extracted.length} skipped.\n`);

  if (extracted.length === 0) {
    console.log("Nothing to upsert. Done.");
    return;
  }

  // ---- Step 3: Upsert into directory_experts --------------------------------

  console.log(`${args.dryRun ? "[DRY RUN] " : ""}Upserting into directory_experts ...\n`);
  const results = await upsertListings(extracted, supabase, args.dryRun);

  console.log(`\nDone!`);
  console.log(`  inserted: ${results.inserted}`);
  console.log(`  updated:  ${results.updated}`);
  console.log(`  skipped:  ${results.skipped}`);
  if (results.errors.length > 0) {
    console.log(`  errors:   ${results.errors.length}`);
    for (const e of results.errors) console.log(`    - ${e.url}: ${e.error}`);
  }

  if (!args.dryRun && results.inserted + results.updated > 0) {
    console.log("\nNew listings are live on /search (if the table exists in Supabase).");
  }
}

main().catch((err) => {
  console.error("Ingestion failed:", err.message || err);
  process.exit(1);
});
