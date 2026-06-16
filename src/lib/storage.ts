import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mint a short-lived signed URL for a private problem-upload attachment.
 * `value` is the stored object path (e.g. "<uid>/<uuid>.mp4"). Returns null
 * when there's nothing to show or the service-role key isn't configured.
 * Call this only after confirming the caller is authorized to see the booking.
 */
export async function signedAttachmentUrl(
  value: string | null | undefined,
): Promise<string | null> {
  if (!value) return null;
  // Legacy/public values may already be full URLs.
  if (value.startsWith("http")) return value;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const admin = createAdminClient();
  const { data } = await admin.storage
    .from("problem-uploads")
    .createSignedUrl(value, 60 * 60); // 1 hour
  return data?.signedUrl ?? null;
}
