// CSV / JSON file import adapter.
// No API key needed — lets you import any list of experts you've gathered manually
// (e.g. exported from a directory site, LinkedIn search, your own spreadsheet).
//
// Accepted CSV columns (any subset; column names are case-insensitive):
//   name / display_name     (required)
//   headline / title
//   email
//   phone
//   website / url
//   booking_url
//   location / city
//   specialties             (comma-separated: "Python, Data Science")
//   category / categories   (comma-separated slugs: "tutoring,career-coaching")
//   blurb / bio             (if provided, Claude still rewrites it to avoid copyright)
//   source_url              (if omitted, website is used; if neither, row is skipped)
//
// Also accepts a .json file: an array of objects with the same fields.
//
// Usage:
//   node scripts/ingestion/run.mjs --source csv --file ./my-tutors.csv --category tutoring

import { readFileSync } from "node:fs";
import { extname } from "node:path";

function normalizeKey(k) {
  return k.trim().toLowerCase().replace(/[^a-z_]/g, "_");
}

function parseCSV(text) {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(normalizeKey);
  return lines.slice(1).map((line) => {
    // Simple CSV parse (handles quoted fields with commas inside).
    const values = [];
    let cur = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { values.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

/**
 * Load a CSV or JSON file and return an array of raw listing objects.
 * @param {string} filePath
 * @param {string} defaultCategory - slug to assign if the row has no category column
 */
export function loadFromFile(filePath, defaultCategory = "") {
  const text = readFileSync(filePath, "utf8");
  const ext = extname(filePath).toLowerCase();

  let rows;
  if (ext === ".json") {
    rows = JSON.parse(text);
  } else {
    rows = parseCSV(text);
  }

  const listings = [];
  for (const row of rows) {
    const name = row.name || row.display_name || row.full_name || "";
    if (!name) continue;

    const website = row.website || row.url || row.website_url || "";
    const sourceUrl = row.source_url || website;
    if (!sourceUrl) {
      console.warn(`  skipping "${name}" — no source_url or website`);
      continue;
    }

    const specialtiesRaw = row.specialties || row.skills || row.subjects || "";
    const categoriesRaw = row.category || row.categories || row.category_slugs || defaultCategory;

    listings.push({
      _raw: [
        `Name: ${name}`,
        row.headline || row.title ? `Title: ${row.headline || row.title}` : null,
        row.location || row.city ? `Location: ${row.location || row.city}` : null,
        specialtiesRaw ? `Specialties: ${specialtiesRaw}` : null,
        row.blurb || row.bio ? `About: ${(row.blurb || row.bio).slice(0, 500)}` : null,
        row.email ? `Email: ${row.email}` : null,
        row.phone ? `Phone: ${row.phone}` : null,
        website ? `Website: ${website}` : null,
        row.booking_url ? `Booking: ${row.booking_url}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      _sourceUrl: sourceUrl,
      _websiteUrl: website || null,
      _phone: row.phone || null,
      _email: row.email || null,
      _categoryHint: categoriesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return listings;
}
