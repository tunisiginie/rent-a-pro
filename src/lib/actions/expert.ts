"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getMyExpertProfile } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/url";
import type { ServiceChannel } from "@/lib/types";

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Create the caller's expert profile (status starts as 'pending'). */
export async function createExpertProfile(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("expert_profiles").insert({
    user_id: user.id,
    display_name: String(formData.get("display_name") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    years_experience: formData.get("years_experience")
      ? Number(formData.get("years_experience"))
      : null,
    specialties: parseList(formData.get("specialties")),
    category_slugs: formData.getAll("categories").map(String),
    photo_url: String(formData.get("photo_url") ?? "") || null,
    intro_video_url: String(formData.get("intro_video_url") ?? "") || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Update mutable fields on the caller's expert profile. */
export async function updateExpertProfile(formData: FormData) {
  const expert = await getMyExpertProfile();
  if (!expert) redirect("/become-an-expert");

  const supabase = await createClient();
  const { error } = await supabase
    .from("expert_profiles")
    .update({
      display_name: String(formData.get("display_name") ?? "").trim(),
      headline: String(formData.get("headline") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      years_experience: formData.get("years_experience")
        ? Number(formData.get("years_experience"))
        : null,
      specialties: parseList(formData.get("specialties")),
      category_slugs: formData.getAll("categories").map(String),
      photo_url: String(formData.get("photo_url") ?? "") || null,
      intro_video_url: String(formData.get("intro_video_url") ?? "") || null,
    })
    .eq("id", expert.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function toggleAvailableNow(formData: FormData) {
  const expert = await getMyExpertProfile();
  if (!expert) return;
  const next = formData.get("available_now") === "true";
  const supabase = await createClient();
  await supabase
    .from("expert_profiles")
    .update({ available_now: next })
    .eq("id", expert.id);
  revalidatePath("/dashboard");
}

export async function addService(formData: FormData) {
  const expert = await getMyExpertProfile();
  if (!expert) redirect("/become-an-expert");

  const dollars = Number(formData.get("price") ?? 0);
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    expert_id: expert.id,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    duration_minutes: formData.get("duration_minutes")
      ? Number(formData.get("duration_minutes"))
      : null,
    channel: (String(formData.get("channel") ?? "video_chat") as ServiceChannel),
    price_cents: Math.round(dollars * 100),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteService(formData: FormData) {
  const expert = await getMyExpertProfile();
  if (!expert) return;
  const id = String(formData.get("service_id"));
  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", id).eq("expert_id", expert.id);
  revalidatePath("/dashboard");
}

export async function addAvailability(formData: FormData) {
  const expert = await getMyExpertProfile();
  if (!expert) return;
  const supabase = await createClient();
  const { error } = await supabase.from("availability").insert({
    expert_id: expert.id,
    day_of_week: Number(formData.get("day_of_week")),
    start_time: String(formData.get("start_time")),
    end_time: String(formData.get("end_time")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteAvailability(formData: FormData) {
  const expert = await getMyExpertProfile();
  if (!expert) return;
  const id = String(formData.get("availability_id"));
  const supabase = await createClient();
  await supabase.from("availability").delete().eq("id", id).eq("expert_id", expert.id);
  revalidatePath("/dashboard");
}

/**
 * Create (or reuse) the expert's Stripe Express account and send them to the
 * hosted onboarding flow. On return they land back on /dashboard.
 */
export async function startStripeOnboarding() {
  const user = await getUser();
  if (!user) redirect("/login");
  const expert = await getMyExpertProfile();
  if (!expert) redirect("/become-an-expert");

  const supabase = await createClient();
  let accountId = expert.stripe_account_id;

  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: "express",
      email: user.email ?? undefined,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });
    accountId = account.id;
    await supabase
      .from("expert_profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", expert.id);
  }

  const baseUrl = await getBaseUrl();
  const link = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/dashboard`,
    return_url: `${baseUrl}/dashboard?stripe=done`,
    type: "account_onboarding",
  });

  redirect(link.url);
}
