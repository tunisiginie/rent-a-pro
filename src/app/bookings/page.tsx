import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCustomerBookings } from "@/lib/queries";
import { formatUsd } from "@/lib/fees";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";

export default async function BookingsPage() {
  const user = await requireUser();
  const bookings = await getCustomerBookings(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">My bookings</h1>
      {bookings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          You haven’t booked anyone yet.{" "}
          <Link href="/search" className="text-primary hover:underline">
            Find a pro
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`} className="block">
              <Card data-size="sm" className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between px-4">
                  <div>
                    <p className="font-medium">
                      {b.services?.title ?? "Consultation"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      with {b.expert_profiles?.display_name} ·{" "}
                      {formatUsd(b.amount_cents)}
                    </p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
