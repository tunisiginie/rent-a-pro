"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { sendDemandEmail } from "@/lib/email";

/** Logs a demand signal for an unmatched search and emails the owner. */
export async function requestSearchNotification(formData: FormData) {
  const query = String(formData.get("query") || "").trim() || null;
  const categorySlug = String(formData.get("category") || "").trim() || null;
  const isSpecific = formData.get("is_specific") === "true";
  const specificDescription =
    String(formData.get("specific_description") || "").trim() || null;
  const user = await getUser();

  const supabase = await createClient();
  const { error } = await supabase.from("search_requests").insert({
    query,
    category_slug: categorySlug,
    requested_by: user?.id ?? null,
    is_specific_request: isSpecific,
    specific_description: specificDescription,
  });
  if (error) throw new Error(error.message);

  await sendDemandEmail({ query, categorySlug, isSpecific, specificDescription });
}
