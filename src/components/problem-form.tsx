"use client";

import { useState } from "react";
import { createBookingCheckout } from "@/lib/actions/payment";
import { CHANNELS, channelLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/media-upload";

export function ProblemForm({
  expertId,
  serviceId,
  payLabel,
}: {
  expertId: string;
  serviceId: string;
  payLabel: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await createBookingCheckout(fd);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-5"
    >
      <input type="hidden" name="expert_id" value={expertId} />
      <input type="hidden" name="service_id" value={serviceId} />

      <div className="space-y-1.5">
        <Label htmlFor="problem_text">Describe your problem</Label>
        <textarea
          id="problem_text"
          name="problem_text"
          rows={5}
          required
          placeholder="e.g. My 2015 BMW 3-series won’t start and there’s a clicking sound…"
          className="w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <MediaUpload
        bucket="problem-uploads"
        accept="video/*,audio/*,image/*"
        label="Attach a video, audio, or photo (optional)"
        name="problem_media_url"
        kind="video"
        privateBucket
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customer_contact_channel">How should they reach you?</Label>
          <select
            id="customer_contact_channel"
            name="customer_contact_channel"
            defaultValue="zoom"
            className="h-8 w-full rounded-lg border border-input bg-input/30 px-2 text-sm"
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {channelLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customer_contact_value">Your contact</Label>
          <Input
            id="customer_contact_value"
            name="customer_contact_value"
            required
            placeholder="email or phone number"
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Starting…" : payLabel}
      </Button>
    </form>
  );
}
