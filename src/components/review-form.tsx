"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/lib/actions/booking";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReviewForm({
  bookingId,
  expertId,
}: {
  bookingId: string;
  expertId: string;
}) {
  const [rating, setRating] = useState(5);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await submitReview(fd);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4"
    >
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="expert_id" value={expertId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="space-y-1.5">
        <Label>Did they answer your question?</Label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="did_answer" value="yes" defaultChecked />
            Yes
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="did_answer" value="no" />
            No
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Rating</Label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              aria-label={`${i + 1} stars`}
            >
              <Star
                className={cn(
                  "size-6",
                  i < rating
                    ? "fill-warning text-warning"
                    : "fill-transparent text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment">Comment (optional)</Label>
        <Input id="comment" name="comment" placeholder="How did it go?" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
