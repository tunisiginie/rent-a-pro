"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { requestSearchNotification } from "@/lib/actions/search-request";
import { Button } from "@/components/ui/button";

export function NotifyMeButton({
  query,
  category,
}: {
  query: string;
  category: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("query", query);
      if (category) fd.set("category", category);
      await requestSearchNotification(fd);
      setSent(true);
      toast.success("Got it — we'll let you know when a pro for this is available.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-success">
        <Check className="size-4" /> We&rsquo;ll notify you when a pro joins for this.
      </p>
    );
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={pending} className="w-full">
      <Bell /> {pending ? "Submitting…" : "Notify me when a pro is available"}
    </Button>
  );
}
