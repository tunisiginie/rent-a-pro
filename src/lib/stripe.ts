import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazily-constructed server-side Stripe client. Constructing eagerly at module
 * load would throw during build when STRIPE_SECRET_KEY is absent, so callers
 * invoke this only on code paths that actually need Stripe.
 * Never import into a Client Component.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    _stripe = new Stripe(key, {
      apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return _stripe;
}

export const PLATFORM_NAME = "Rent a Pro";
