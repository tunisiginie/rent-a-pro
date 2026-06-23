"use client";

import { useState } from "react";
import { toast } from "sonner";
import { removeDirectoryListing } from "@/lib/actions/lead";

/** Opt-out control on an unclaimed listing ("This is me / Remove me"). */
export function RemoveListingButton({ directoryExpertId }: { directoryExpertId: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onClick() {
    if (!confirm("Remove this listing from Rent a Pro?")) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("directory_expert_id", directoryExpertId);
      await removeDirectoryListing(fd);
      setDone(true);
      toast.success("Listing removed. It will no longer appear.");
    } catch {
      toast.error("Couldn't remove the listing. Email us and we'll handle it.");
    } finally {
      setPending(false);
    }
  }

  if (done) return <span className="text-xs text-muted-foreground">Listing removed.</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
    >
      {pending ? "Removing..." : "Remove this listing"}
    </button>
  );
}
