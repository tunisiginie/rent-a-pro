"use client";

import Link from "next/link";
import { Clock, Search } from "lucide-react";
import { useRecentSearches } from "@/lib/recents";

export function RecentsTile() {
  const recents = useRecentSearches();

  return (
    <div className="flex min-h-40 flex-col rounded-2xl bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="size-4" /> Recents
      </div>
      {recents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {recents.map((q) => (
            <Link
              key={q}
              href={`/search?q=${encodeURIComponent(q)}`}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Search className="size-3.5" />
              {q}
            </Link>
          ))}
        </div>
      ) : (
        <p className="my-auto text-sm text-muted-foreground">
          Your recent searches show up here.
        </p>
      )}
    </div>
  );
}
