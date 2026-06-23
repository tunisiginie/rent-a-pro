"use client";

import { useState } from "react";
import { CalendarCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { submitLead } from "@/lib/actions/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Broker CTA for an unclaimed directory listing: captures the customer's need +
 * contact, logs a lead, and pings the operator to broker the booking.
 */
export function RequestToBook({
  directoryExpertId,
  expertName,
}: {
  directoryExpertId: string;
  expertName: string;
}) {
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState("");
  const [contact, setContact] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("directory_expert_id", directoryExpertId);
      fd.set("need_text", need.trim());
      fd.set("requester_contact", contact.trim());
      await submitLead(fd);
      setSent(true);
      toast.success("Got it - we'll connect you with " + expertName + ".");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="flex items-center justify-center gap-1.5 rounded-xl bg-success/10 p-4 text-sm text-success">
        <Check className="size-4" /> We&rsquo;ll reach out to {expertName} and connect you.
      </p>
    );
  }

  if (!open) {
    return (
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        <CalendarCheck className="size-4" /> Request to book {expertName}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium">Request to book {expertName}</p>
      <textarea
        autoFocus
        value={need}
        onChange={(e) => setNeed(e.target.value)}
        placeholder="What do you need help with?"
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Your email or phone so we can connect you"
        required
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !contact.trim()} className="flex-1">
          {pending ? "Sending..." : "Send request"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        We&rsquo;ll reach out to the expert on your behalf and arrange the session.
      </p>
    </form>
  );
}
