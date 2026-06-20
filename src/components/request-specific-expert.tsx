"use client";

import { useState } from "react";
import { UserSearch, Check } from "lucide-react";
import { toast } from "sonner";
import { requestSearchNotification } from "@/lib/actions/search-request";
import { Button } from "@/components/ui/button";

export function RequestSpecificExpert({
  query,
  category,
}: {
  query: string;
  category: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("query", query);
      if (category) fd.set("category", category);
      fd.set("is_specific", "true");
      fd.set("specific_description", description.trim());
      await requestSearchNotification(fd);
      setSent(true);
      toast.success("Request sent — we'll find someone who fits.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-success">
        <Check className="size-4" /> We&rsquo;ll reach out when we find your expert.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setOpen(true)}>
        <UserSearch className="size-4" />
        Request a specific expert
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        autoFocus
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe exactly who you need, e.g. BMW-certified mechanic in LA with 10+ years exp"
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !description.trim()} className="flex-1">
          {pending ? "Sending…" : "Send request"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
