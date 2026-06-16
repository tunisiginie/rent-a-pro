"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getProfile } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { computeFees } from "@/lib/fees";
import { getBaseUrl } from "@/lib/url";
import type { ExpertProfile, Service } from "@/lib/types";

/**
 * Creates a booking and starts payment. Uses a Stripe Connect destination
 * charge so the platform takes an application fee and the expert receives the
 * remainder. Falls back to a mock "paid" booking when Stripe isn't configured.
 */
export async function createBookingCheckout(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  const profile = await getProfile();

  const expertId = String(formData.get("expert_id"));
  const serviceId = String(formData.get("service_id"));

  const supabase = await createClient();
  const [{ data: service }, { data: expert }] = await Promise.all([
    supabase.from("services").select("*").eq("id", serviceId).maybeSingle(),
    supabase
      .from("expert_profiles")
      .select("*")
      .eq("id", expertId)
      .maybeSingle(),
  ]);

  const svc = service as Service | null;
  const exp = expert as ExpertProfile | null;
  if (!svc || !exp) throw new Error("Service or expert not found.");

  const fees = computeFees(svc.price_cents);
  const stripeReady =
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    exp.charges_enabled &&
    Boolean(exp.stripe_account_id);

  // Create the booking row up front (RLS: customer owns it).
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      customer_name: profile?.full_name ?? null,
      expert_id: expertId,
      service_id: serviceId,
      problem_text: String(formData.get("problem_text") || "") || null,
      problem_media_url: String(formData.get("problem_media_url") || "") || null,
      customer_contact_channel:
        String(formData.get("customer_contact_channel") || "") || null,
      customer_contact_value:
        String(formData.get("customer_contact_value") || "") || null,
      status: "requested",
      amount_cents: fees.amountCents,
      service_price_cents: fees.servicePriceCents,
      customer_fee_cents: fees.customerFeeCents,
      expert_fee_cents: fees.expertFeeCents,
      expert_payout_cents: fees.expertPayoutCents,
      payment_status: stripeReady ? "unpaid" : "paid", // mock path = paid
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const bookingId = (booking as { id: string }).id;
  const baseUrl = await getBaseUrl();

  if (!stripeReady) {
    // Demo fallback: no real charge, jump straight to the booking page.
    redirect(`/bookings/${bookingId}?paid=mock`);
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: fees.amountCents,
          product_data: { name: `${svc.title} — ${exp.display_name}` },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: fees.applicationFeeCents,
      transfer_data: { destination: exp.stripe_account_id! },
    },
    metadata: { booking_id: bookingId },
    success_url: `${baseUrl}/bookings/${bookingId}?paid=1`,
    cancel_url: `${baseUrl}/experts/${expertId}`,
  });

  redirect(session.url!);
}
