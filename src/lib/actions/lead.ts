"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { sendLeadEmail } from "@/lib/email";
import type { DirectoryExpert } from "@/lib/types";

/**
 * Capture a booking lead for an unclaimed (directory) expert and ping the
 * operator so they can broker the deal. Insert goes through normal RLS (anyone
 * may insert a lead). No-ops the email gracefully without RESEND_API_KEY.
 */
export async function submitLead(formData: FormData) {
  const directoryExpertId =
    String(formData.get("directory_expert_id") || "").trim() || null;
  const needText = String(formData.get("need_text") || "").trim() || null;
  const requesterContact =
    String(formData.get("requester_contact") || "").trim() || null;
  const user = await getUser();

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    directory_expert_id: directoryExpertId,
    requester_id: user?.id ?? null,
    requester_contact: requesterContact,
    need_text: needText,
  });
  if (error) throw new Error(error.message);

  // Look up the listing for the operator ping (best-effort).
  let listing: DirectoryExpert | null = null;
  if (directoryExpertId) {
    const { data } = await supabase
      .from("directory_experts")
      .select("*")
      .eq("id", directoryExpertId)
      .maybeSingle();
    listing = (data as DirectoryExpert) ?? null;
  }

  await sendLeadEmail({
    expertName: listing?.display_name ?? "an expert",
    needText,
    requesterContact,
    expertContact:
      listing?.public_email ||
      listing?.public_phone ||
      listing?.booking_url ||
      listing?.website_url ||
      null,
    sourceUrl: listing?.source_url ?? null,
  });
}

/**
 * Opt-out / "Remove me" for a directory listing. Hides it from the public
 * directory immediately (service role, since public has no update policy).
 */
export async function removeDirectoryListing(formData: FormData) {
  const id = String(formData.get("directory_expert_id") || "").trim();
  if (!id) return;
  const admin = createAdminClient();
  await admin
    .from("directory_experts")
    .update({ status: "removed" })
    .eq("id", id);
  revalidatePath(`/directory/${id}`);
}
