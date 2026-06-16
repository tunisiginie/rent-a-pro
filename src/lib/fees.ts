// Marketplace fee model — Rent a Pro takes a cut from BOTH sides (Fiverr-style).
//
// The customer pays the service price PLUS a customer service fee.
// The expert receives the service price MINUS an expert fee.
// The platform keeps (customer fee + expert fee) as a single Stripe application fee
// on a destination charge to the expert's connected account.

export const CUSTOMER_FEE_PCT = 0.1; // 10% added on top of the price
export const EXPERT_FEE_PCT = 0.2; // 20% deducted from the expert's payout

export interface FeeBreakdown {
  servicePriceCents: number;
  customerFeeCents: number;
  amountCents: number; // total charged to the customer
  expertFeeCents: number;
  expertPayoutCents: number; // landed in the expert's connected account
  applicationFeeCents: number; // platform's total take (customer fee + expert fee)
}

/** Compute the full fee breakdown for a given base service price. */
export function computeFees(servicePriceCents: number): FeeBreakdown {
  const customerFeeCents = Math.round(servicePriceCents * CUSTOMER_FEE_PCT);
  const expertFeeCents = Math.round(servicePriceCents * EXPERT_FEE_PCT);
  const amountCents = servicePriceCents + customerFeeCents;
  const expertPayoutCents = servicePriceCents - expertFeeCents;
  const applicationFeeCents = customerFeeCents + expertFeeCents;
  return {
    servicePriceCents,
    customerFeeCents,
    amountCents,
    expertFeeCents,
    expertPayoutCents,
    applicationFeeCents,
  };
}

/** Format cents as USD, e.g. 3000 -> "$30". */
export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}
