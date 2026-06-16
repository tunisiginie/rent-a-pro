import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Phone, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getBookingDetail } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { signedAttachmentUrl } from "@/lib/storage";
import { formatUsd } from "@/lib/fees";
import { channelLabel } from "@/lib/labels";
import { cancelBooking } from "@/lib/actions/booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { ReviewForm } from "@/components/review-form";

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { paid } = await searchParams;

  const booking = await getBookingDetail(id);
  if (!booking) notFound();

  const isCustomer = booking.customer_id === user.id;
  const attachment = await signedAttachmentUrl(booking.problem_media_url);

  // Has the customer already reviewed?
  const supabase = await createClient();
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", id)
    .maybeSingle();

  const connected =
    booking.status === "accepted" || booking.status === "scheduled";
  const canReview =
    isCustomer &&
    !existingReview &&
    (booking.status === "accepted" ||
      booking.status === "scheduled" ||
      booking.status === "completed");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {paid ? (
        <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
          <CheckCircle2 className="size-4 text-success" />
          Payment received. {booking.expert_profiles?.display_name} has been
          notified and will respond shortly.
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {booking.services?.title ?? "Consultation"}
          </h1>
          <p className="text-muted-foreground">
            with {booking.expert_profiles?.display_name}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Connect details, revealed on acceptance */}
      {connected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="size-4" /> How you’ll connect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {booking.scheduled_at ? (
              <p className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                {new Date(booking.scheduled_at).toLocaleString()}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Channel: </span>
              {channelLabel(booking.connect_channel)}
            </p>
            {booking.connect_details ? (
              <p className="rounded-md bg-muted/40 p-2">{booking.connect_details}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {booking.status === "declined" ? (
        <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
          This expert declined. You weren’t charged for a declined request, or
          you’ll be refunded.{" "}
          <Link href="/search" className="text-primary hover:underline">
            Find another pro
          </Link>
          .
        </p>
      ) : null}

      {/* The problem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {booking.problem_text ? <p>{booking.problem_text}</p> : null}
          {attachment ? (
            <a
              href={attachment}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              View attachment
            </a>
          ) : null}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Paid</span>
            <span>{formatUsd(booking.amount_cents)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Review */}
      {canReview ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rate your consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm bookingId={booking.id} expertId={booking.expert_id} />
          </CardContent>
        </Card>
      ) : null}

      {/* Cancel (customer, still pending) */}
      {isCustomer && booking.status === "requested" ? (
        <form action={cancelBooking}>
          <input type="hidden" name="booking_id" value={booking.id} />
          <Button type="submit" variant="outline">
            Cancel request
          </Button>
        </form>
      ) : null}
    </div>
  );
}
