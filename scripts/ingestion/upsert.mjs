// Deduplicate and upsert extracted listings into directory_experts.
// Deduplication strategy (Phase 0): source_url is the primary key.
// If a row with the same source_url already exists, update it (refresh the
// fetched data). Never create duplicates from the same source.

/**
 * Upsert an array of extracted listings into directory_experts.
 * Returns a summary of what happened.
 *
 * @param {object[]} listings - Array of objects with at least { source, source_url, ...extracted }
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {boolean} dryRun - If true, print what would happen without writing.
 */
export async function upsertListings(listings, supabase, dryRun = false) {
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const listing of listings) {
    if (!listing.display_name || !listing.source_url) {
      results.skipped++;
      continue;
    }

    if (dryRun) {
      console.log(
        `  [dry-run] would upsert: ${listing.display_name} (${listing.source_url.slice(0, 60)})`
      );
      results.inserted++;
      continue;
    }

    // Check if this source_url already exists.
    const { data: existing } = await supabase
      .from("directory_experts")
      .select("id, display_name")
      .eq("source_url", listing.source_url)
      .maybeSingle();

    const payload = {
      display_name: listing.display_name,
      headline: listing.headline || null,
      blurb: listing.blurb || null,
      category_slugs: listing.category_slugs || [],
      specialties: listing.specialties || [],
      location: listing.location || null,
      website_url: listing.website_url || null,
      booking_url: listing.booking_url || null,
      public_email: listing.public_email || null,
      public_phone: listing.public_phone || null,
      photo_url: listing.photo_url || null,
      source: listing.source,
      source_url: listing.source_url,
      fetched_at: new Date().toISOString(),
      status: "listed",
    };

    if (existing) {
      // Update — refresh the listing data.
      const { error } = await supabase
        .from("directory_experts")
        .update(payload)
        .eq("id", existing.id)
        .eq("claimed", false); // never overwrite a claimed listing
      if (error) {
        results.errors.push({ url: listing.source_url, error: error.message });
      } else {
        results.updated++;
        console.log(`  updated: ${listing.display_name}`);
      }
    } else {
      // Insert new listing.
      const { error } = await supabase.from("directory_experts").insert(payload);
      if (error) {
        results.errors.push({ url: listing.source_url, error: error.message });
      } else {
        results.inserted++;
        console.log(`  inserted: ${listing.display_name}`);
      }
    }
  }

  return results;
}
