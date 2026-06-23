// Google Places Text Search adapter.
// Uses the Places API (legacy text search, simplest + most widely supported).
// Requires: GOOGLE_PLACES_API_KEY in your .env.local
//
// Free tier: $200/month credit = ~3,300 text searches or ~11,000 detail lookups.
// Good enough to bootstrap hundreds of listings without paying.
//
// Usage:
//   node scripts/ingestion/run.mjs --source google-places --category tutoring --city "Los Angeles, CA"

const BASE_URL = "https://maps.googleapis.com/maps/api/place";

/**
 * Fetch places for a given search term + city using the Google Places Text Search API.
 * Returns an array of raw listing objects ready to pass to extractAndNormalize.
 *
 * @param {string} searchTerm - e.g. "tutoring", "career coach", "personal trainer"
 * @param {string} city - e.g. "Los Angeles, CA"
 * @param {string} apiKey
 * @param {number} maxResults - cap to avoid burning API quota (default 20)
 */
export async function fetchGooglePlaces(searchTerm, city, apiKey, maxResults = 20) {
  const query = encodeURIComponent(`${searchTerm} in ${city}`);
  const url = `${BASE_URL}/textsearch/json?query=${query}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Places API error: ${res.status} ${res.statusText}`);
  const json = await res.json();

  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places: ${json.status} — ${json.error_message || ""}`);
  }

  const results = (json.results || []).slice(0, maxResults);
  const listings = [];

  for (const place of results) {
    // Optionally fetch place details for website + phone (costs 1 detail lookup each).
    let website = null;
    let phone = null;

    if (place.place_id) {
      const detailsUrl = `${BASE_URL}/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${apiKey}`;
      const detailRes = await fetch(detailsUrl);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        website = detail.result?.website || null;
        phone = detail.result?.formatted_phone_number || null;
      }
      // Small delay to be polite to the API.
      await new Promise((r) => setTimeout(r, 120));
    }

    listings.push({
      // These fields go straight to Claude for normalization.
      _raw: `Name: ${place.name}\nAddress: ${place.formatted_address}\nTypes: ${(place.types || []).join(", ")}\nRating: ${place.rating || "N/A"} (${place.user_ratings_total || 0} reviews)\nWebsite: ${website || "N/A"}\nPhone: ${phone || "N/A"}`,
      _sourceUrl: website || `https://maps.google.com/?cid=${place.place_id}`,
      _websiteUrl: website,
      _phone: phone,
    });
  }

  return listings;
}
