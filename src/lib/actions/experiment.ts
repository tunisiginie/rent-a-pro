"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/** Logs an A/B experiment event (impression | convert). No-ops without Supabase. */
export async function logExperimentEvent(
  variant: string,
  event: "impression" | "convert",
  experiment = "home_copy",
) {
  if (!isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase
    .from("experiment_events")
    .insert({ experiment, variant, event });
}
