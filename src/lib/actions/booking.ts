"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getMyExpertProfile } from "@/lib/auth";

/** Expert accepts a request: sets the scheduled time + how they'll connect. */
export async function acceptBooking(formData: FormData) {
  const expert = await getMyExpertProfile();
  if (!expert) redirect("/login");

  const bookingId = String(formData.get("booking_id"));
  const scheduledAt = String(formData.get("scheduled_at") || "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      connect_channel: String(formData.get("connect_channel") || ""),
      connect_details: String(formData.get("connect_details") || ""),
    })
    .eq("id", bookingId)
    .eq("expert_id", expert.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath(`/bookings/${bookingId}`);
}

/** Expert declines a request. */
export async function declineBooking(formData: FormData) {
  const expert = await getMyExpertProfile();
  if (!expert) redirect("/login");

  const bookingId = String(formData.get("booking_id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("expert_id", expert.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath(`/bookings/${bookingId}`);
  // NOTE (phase 2): on decline/timeout, ping the next nearby experts.
}

/** Customer cancels their own request. */
export async function cancelBooking(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const bookingId = String(formData.get("booking_id"));
  const supabase = await createClient();
  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("customer_id", user.id);

  revalidatePath(`/bookings/${bookingId}`);
}

/** Customer leaves the post-consultation review ("did they answer?"). */
export async function submitReview(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const bookingId = String(formData.get("booking_id"));
  const expertId = String(formData.get("expert_id"));
  const supabase = await createClient();

  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    customer_id: user.id,
    expert_id: expertId,
    rating: formData.get("rating") ? Number(formData.get("rating")) : null,
    did_answer: formData.get("did_answer") === "yes",
    comment: String(formData.get("comment") || "") || null,
  });
  if (error) throw new Error(error.message);

  await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId)
    .eq("customer_id", user.id);

  revalidatePath(`/bookings/${bookingId}`);
}
