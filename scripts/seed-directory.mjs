// Phase 0 demo seed: inserts a few sample "unclaimed" directory listings so the
// directory + broker flow can be exercised before the real ingestion pipeline
// is wired. Run AFTER applying supabase/schema.sql (needs the directory_experts
// table). These are illustrative sample rows — delete them before real launch:
//   delete from public.directory_experts where source = 'seed_sample';
//
//   node scripts/seed-directory.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const rows = [
  {
    display_name: "Maria Alvarez",
    headline: "AP Calculus & SAT Math Tutor",
    blurb: "Helps high-schoolers turn math anxiety into confident exam scores.",
    category_slugs: ["tutoring"],
    specialties: ["AP Calculus", "SAT Math", "Algebra II"],
    location: "Los Angeles, CA",
    website_url: "https://example.com/maria-tutoring",
  },
  {
    display_name: "Daniel Okafor",
    headline: "Computer Science & Python Tutor",
    blurb: "CS grad who makes data structures and Python click for beginners.",
    category_slugs: ["tutoring"],
    specialties: ["Python", "Data Structures", "Intro CS"],
    location: "Remote",
    website_url: "https://example.com/daniel-cs",
  },
  {
    display_name: "Sofia Bianchi",
    headline: "IELTS & Conversational English Coach",
    blurb: "Prepares adult learners for IELTS and real-world English fluency.",
    category_slugs: ["tutoring"],
    specialties: ["IELTS", "ESL", "Business English"],
    location: "Remote",
    website_url: "https://example.com/sofia-english",
  },
  {
    display_name: "James Whitfield",
    headline: "Career Coach & Interview Prep",
    blurb: "Ex-recruiter who coaches candidates through resumes and mock interviews.",
    category_slugs: ["career-coaching"],
    specialties: ["Interview Prep", "Resume Review", "Salary Negotiation"],
    location: "New York, NY",
    booking_url: "https://example.com/james-coaching/book",
  },
  {
    display_name: "Priya Nair",
    headline: "Tech Career & PM Transition Coach",
    blurb: "Guides career-switchers into product and program management roles.",
    category_slugs: ["career-coaching"],
    specialties: ["Product Management", "Career Change", "Mock Interviews"],
    location: "Remote",
    booking_url: "https://example.com/priya-pm/book",
  },
];

const payload = rows.map((r) => ({
  ...r,
  source: "seed_sample",
  source_url: r.website_url || r.booking_url || "https://example.com",
  status: "listed",
}));

// Avoid dup-seeding: clear prior sample rows, then insert.
await supabase.from("directory_experts").delete().eq("source", "seed_sample");
const { data, error } = await supabase
  .from("directory_experts")
  .insert(payload)
  .select("id, display_name, category_slugs");
if (error) throw error;
console.log(`Seeded ${data.length} directory listings:`);
for (const d of data) console.log(` - ${d.display_name} [${d.category_slugs.join(", ")}] -> /directory/${d.id}`);
