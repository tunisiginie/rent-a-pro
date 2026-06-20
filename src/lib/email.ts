// Minimal transactional email via Resend's REST API (no SDK dependency).
// No-ops gracefully when RESEND_API_KEY isn't set yet, mirroring the Stripe
// pattern elsewhere in this app: the feature works end-to-end, the email
// activates once the key is added.

interface DemandEmailParams {
  query: string | null;
  categorySlug: string | null;
  isSpecific?: boolean;
  specificDescription?: string | null;
  autoTriggered?: boolean;
}

export async function sendDemandEmail({
  query,
  categorySlug,
  isSpecific = false,
  specificDescription = null,
  autoTriggered = false,
}: DemandEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = process.env.DEMAND_NOTIFICATION_EMAIL || "mbyazidi@gmail.com";

  let subject: string;
  let text: string;

  if (isSpecific && specificDescription) {
    subject = `Specific expert requested: "${specificDescription.slice(0, 60)}"`;
    text = [
      "A visitor requested a specific expert that Rent a Pro doesn't have yet.",
      `Description: "${specificDescription}"`,
      query ? `Original search: "${query}"` : null,
      categorySlug ? `Category: ${categorySlug}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  } else {
    subject = query
      ? `${autoTriggered ? "[Auto] " : ""}Unmet search demand: "${query}"`
      : `${autoTriggered ? "[Auto] " : ""}Unmet search demand in category "${categorySlug}"`;
    text = [
      autoTriggered
        ? "A search on Rent a Pro returned zero results (auto-alert)."
        : "Someone searched Rent a Pro and we didn't have a matching pro.",
      query ? `Search: "${query}"` : null,
      categorySlug ? `Category: ${categorySlug}` : null,
      autoTriggered ? null : "They asked to be notified when one's available.",
    ]
      .filter(Boolean)
      .join("\n");
  }

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
