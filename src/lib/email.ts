// Minimal transactional email via Resend's REST API (no SDK dependency).
// No-ops gracefully when RESEND_API_KEY isn't set yet, mirroring the Stripe
// pattern elsewhere in this app: the feature works end-to-end, the email
// activates once the key is added.

interface DemandEmailParams {
  query: string | null;
  categorySlug: string | null;
}

export async function sendDemandEmail({ query, categorySlug }: DemandEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = process.env.DEMAND_NOTIFICATION_EMAIL || "mbyazidi@gmail.com";
  const subject = query
    ? `Unmet search demand: "${query}"`
    : `Unmet search demand in category "${categorySlug}"`;
  const text = [
    "Someone searched Rent a Pro and we didn't have a matching pro.",
    query ? `Search: "${query}"` : null,
    categorySlug ? `Category: ${categorySlug}` : null,
    "They asked to be notified when one's available.",
  ]
    .filter(Boolean)
    .join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Rent a Pro <onboarding@resend.dev>",
      to,
      subject,
      text,
    }),
  });
}
