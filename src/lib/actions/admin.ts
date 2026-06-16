"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("Not authorized.");
}

async function setExpertStatus(expertId: string, status: "approved" | "rejected") {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("expert_profiles")
    .update({ status })
    .eq("id", expertId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function approveExpert(formData: FormData) {
  await setExpertStatus(String(formData.get("expert_id")), "approved");
}

export async function rejectExpert(formData: FormData) {
  await setExpertStatus(String(formData.get("expert_id")), "rejected");
}
