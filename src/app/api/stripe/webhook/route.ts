import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe needs the raw, unparsed body to verify the signature.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    // Expert finished (or updated) Stripe onboarding — sync their payout status.
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await admin
        .from("expert_profiles")
        .update({ charges_enabled: account.charges_enabled ?? false })
        .eq("stripe_account_id", account.id);
      break;
    }

    // Customer paid for a booking — mark it paid.
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (bookingId) {
        await admin
          .from("bookings")
          .update({
            payment_status: "paid",
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
          })
          .eq("id", bookingId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
