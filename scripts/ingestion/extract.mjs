// Claude-powered extraction: turns raw listing data (HTML snippet, JSON, or
// plain text) into a clean DirectoryExpert row. Uses claude-haiku-4-5 for
// speed + cost efficiency on batch ingestion.

// The Anthropic client is passed in as a parameter from run.mjs.

const CATEGORIES = [
  "tutoring",
  "career-coaching",
  "fitness",
  "nutrition",
  "cars",
  "fireplace",
  "electronics",
  "home",
  "plumbing",
  "tech",
];

const SCHEMA = `{
  "display_name": "string (required) - person or business name",
  "headline": "string | null - short professional title, e.g. 'AP Calculus Tutor'",
  "blurb": "string | null - 1 sentence YOU write in your own words (never copy from source). Describe who this expert helps and how.",
  "category_slugs": ["array of matching slugs from: ${CATEGORIES.join(", ")}"],
  "specialties": ["array of specific skills/subjects, e.g. 'AP Calculus', 'Interview Prep'"],
  "location": "string | null - city, state or 'Remote'",
  "website_url": "string | null - their website",
  "booking_url": "string | null - direct booking link if different from website",
  "public_email": "string | null - public contact email only",
  "public_phone": "string | null - public phone number only"
}`;

/**
 * Extract and normalize a raw listing into the DirectoryExpert schema.
 * Returns null if the data is clearly not a real expert listing.
 *
 * @param {string} rawData - Raw text, HTML excerpt, or JSON from the source.
 * @param {string} sourceHint - e.g. "google_places" or "csv" to help Claude understand the context.
 * @param {Anthropic} client - Anthropic client instance.
 */
export async function extractAndNormalize(rawData, sourceHint, client) {
  const prompt = `You are an expert data extractor for a professional marketplace called Rent a Pro.

I will give you raw data about a person or business from the source: ${sourceHint}.

Extract the following information into JSON. Follow these rules strictly:
1. Only include information that is PUBLICLY visible in the source.
2. Write the "blurb" field yourself in one sentence — do NOT copy any text from the source.
3. Only assign category_slugs that genuinely match from this list: ${CATEGORIES.join(", ")}.
4. If this is not a real person/business (e.g. a paid ad slot, an aggregate, a directory homepage), return null.
5. Respond with ONLY valid JSON matching this schema (or null):

${SCHEMA}

Raw data:
${rawData.slice(0, 4000)}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}|\bnull\b/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed === null) return null;
    if (!parsed.display_name) return null;
    if (!parsed.category_slugs || parsed.category_slugs.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}
