"use client";

import { useState } from "react";
import { acceptBooking, declineBooking } from "@/lib/actions/booking";
import { channelLabel, CHANNELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AcceptRequestForm({
  bookingId,
  contactChannel,
  contactValue,
}: {
  bookingId: string;
  contactChannel: string | null;
  contactValue: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setOpen(true)}>
          Accept
        </Button>
        <form action={declineBooking}>
          <input type="hidden" name="booking_id" value={bookingId} />
          <Button size="sm" variant="outline" type="submit">
            Decline
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form action={acceptBooking} className="space-y-3 rounded-lg border border-border p-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      {contactValue ? (
        <p className="text-xs text-muted-foreground">
          Customer prefers <strong>{channelLabel(contactChannel)}</strong>:{" "}
          <span className="text-foreground">{contactValue}</span>
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`when-${bookingId}`}>Scheduled time</Label>
          <Input
            id={`when-${bookingId}`}
            name="scheduled_at"
            type="datetime-local"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`ch-${bookingId}`}>Connect via</Label>
          <select
            id={`ch-${bookingId}`}
            name="connect_channel"
            defaultValue={contactChannel ?? "zoom"}
            className="h-8 w-full rounded-lg border border-input bg-input/30 px-2 text-sm"
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {channelLabel(c)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`details-${bookingId}`}>
          Details for the customer (link, number, instructions)
        </Label>
        <Input
          id={`details-${bookingId}`}
          name="connect_details"
          placeholder="Zoom: https://zoom.us/j/… or call them at the number above"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit">
          Confirm acceptance
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
