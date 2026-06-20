import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { requireUser, getMyExpertProfile } from "@/lib/auth";
import { getCategories, getExpertBookings } from "@/lib/queries";
import { signedAttachmentUrl } from "@/lib/storage";
import { formatUsd } from "@/lib/fees";
import { channelLabel, CHANNELS } from "@/lib/labels";
import {
  updateExpertProfile,
  toggleAvailableNow,
  addService,
  deleteService,
  startStripeOnboarding,
} from "@/lib/actions/expert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpertProfileForm } from "@/components/expert-profile-form";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { AcceptRequestForm } from "@/components/dashboard/accept-request-form";
import { WeeklyAvailabilityGrid } from "@/components/weekly-availability-grid";

export default async function DashboardPage() {
  await requireUser();
  const expert = await getMyExpertProfile();
  if (!expert) redirect("/become-an-expert");

  const [categories, bookings] = await Promise.all([
    getCategories(),
    getExpertBookings(expert.id),
  ]);
  const requests = bookings.filter((b) => b.status === "requested");
  const attachments = Object.fromEntries(
    await Promise.all(
      bookings.map(
        async (b) =>
          [b.id, await signedAttachmentUrl(b.problem_media_url)] as const,
      ),
    ),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Expert dashboard</h1>
        {expert.status === "approved" ? (
          <Badge className="bg-success/15 text-success">Approved</Badge>
        ) : expert.status === "rejected" ? (
          <Badge className="bg-destructive/15 text-destructive">Rejected</Badge>
        ) : (
          <Badge className="bg-warning/15 text-warning">Pending review</Badge>
        )}
      </div>

      {expert.status === "pending" ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
          Your profile is awaiting admin approval. You can finish setting up
          while you wait.
        </p>
      ) : null}

      {/* Payouts (Stripe Connect) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {expert.charges_enabled ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" /> Stripe payouts connected.
            </p>
          ) : (
            <form action={startStripeOnboarding} className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="size-4 text-warning" />
                Connect Stripe to receive payments. You won&rsquo;t appear in
                search until this is done.
              </p>
              <Button type="submit">
                {expert.stripe_account_id ? "Finish Stripe setup" : "Connect Stripe"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Available now */}
      <form action={toggleAvailableNow}>
        <input
          type="hidden"
          name="available_now"
          value={(!expert.available_now).toString()}
        />
        <button
          type="submit"
          className={`flex w-full flex-col items-center gap-2 rounded-2xl border p-8 text-center transition-colors ${
            expert.available_now
              ? "border-success/40 bg-success/10 hover:bg-success/15"
              : "border-border bg-card hover:bg-secondary"
          }`}
        >
          <span
            className={`flex size-3 items-center justify-center rounded-full ${
              expert.available_now ? "bg-success" : "bg-muted-foreground"
            }`}
          />
          <span className="text-xl font-bold">
            {expert.available_now ? "You're available now" : "Available Now"}
          </span>
          <span className="text-sm text-muted-foreground">
            {expert.available_now
              ? "Customers see a live badge. Click to turn off."
              : "Click here to show a live badge and take instant requests."}
          </span>
        </button>
      </form>

      {/* Incoming requests */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Requests{" "}
          {requests.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              ({requests.length} new)
            </span>
          ) : null}
        </h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Card key={b.id} data-size="sm">
                <CardContent className="space-y-3 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {b.customer_name || "A customer"}
                        {b.services?.title ? ` · ${b.services.title}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatUsd(b.service_price_cents)} ·{" "}
                        {channelLabel(b.services?.channel)}
                      </p>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  {b.problem_text ? (
                    <p className="text-sm">{b.problem_text}</p>
                  ) : null}
                  {attachments[b.id] ? (
                    <a
                      href={attachments[b.id]!}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View attachment
                    </a>
                  ) : null}

                  {b.status === "requested" ? (
                    <AcceptRequestForm
                      bookingId={b.id}
                      contactChannel={b.customer_contact_channel}
                      contactValue={b.customer_contact_value}
                    />
                  ) : (
                    <Link
                      href={`/bookings/${b.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View booking →
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Services */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Services</h2>
        <ServicesEditor expertId={expert.id} />
      </section>

      {/* Availability */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Weekly availability</h2>
        <AvailabilityEditor expertId={expert.id} />
      </section>

      {/* Profile */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Edit profile</h2>
        <ExpertProfileForm
          categories={categories}
          expert={expert}
          action={updateExpertProfile}
          submitLabel="Save changes"
        />
      </section>
    </div>
  );
}

/* ----- Services editor (server-rendered list + add/delete forms) ----- */
async function ServicesEditor({ expertId }: { expertId: string }) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("expert_id", expertId)
    .order("price_cents");
  const services = data ?? [];

  return (
    <div className="space-y-3">
      {services.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
        >
          <span>
            {s.title} · {formatUsd(s.price_cents)} · {channelLabel(s.channel)}
            {s.duration_minutes ? ` · ${s.duration_minutes}m` : ""}
          </span>
          <form action={deleteService}>
            <input type="hidden" name="service_id" value={s.id} />
            <Button type="submit" size="icon-sm" variant="ghost">
              <Trash2 />
            </Button>
          </form>
        </div>
      ))}

      <form action={addService} className="grid gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="svc-title">Title</Label>
          <Input id="svc-title" name="title" required placeholder="10m Video Chat" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="svc-price">Price (USD)</Label>
          <Input id="svc-price" name="price" type="number" min={1} step="1" required placeholder="30" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="svc-duration">Duration (min)</Label>
          <Input id="svc-duration" name="duration_minutes" type="number" min={1} placeholder="10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="svc-channel">Channel</Label>
          <select
            id="svc-channel"
            name="channel"
            defaultValue="video_chat"
            className="h-8 w-full rounded-lg border border-input bg-input/30 px-2 text-sm"
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {channelLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="svc-desc">Description</Label>
          <Input id="svc-desc" name="description" placeholder="Assistance in rebuild" />
        </div>
        <Button type="submit" className="sm:col-span-2">
          Add service
        </Button>
      </form>
    </div>
  );
}

/* ----- Availability editor (weekly grid) ----- */
async function AvailabilityEditor({ expertId }: { expertId: string }) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability")
    .select("day_of_week, start_time")
    .eq("expert_id", expertId)
    .order("day_of_week");
  const slots = (data ?? []) as { day_of_week: number; start_time: string }[];

  return <WeeklyAvailabilityGrid slots={slots} />;
}
