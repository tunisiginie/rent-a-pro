"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Check } from "lucide-react";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function SearchFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const category = params.get("category") ?? "";
  const available = params.get("available") === "1";
  const sort = params.get("sort") ?? "rating";

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`/search?${sp.toString()}`);
  }

  const activeCount =
    (category ? 1 : 0) + (available ? 1 : 0) + (sort !== "rating" ? 1 : 0);

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        className="gap-2"
      >
        <SlidersHorizontal className="size-4" />
        Filter
        {activeCount > 0 ? (
          <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4">
          <div>
            <p className="mb-2 text-sm font-medium">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => update({ category: null })}
                className={pill(!category)}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => update({ category: c.slug })}
                  className={pill(category === c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Sort by</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => update({ sort: null })}
                className={pill(sort === "rating")}
              >
                Top rated
              </button>
              <button
                onClick={() => update({ sort: "reviews" })}
                className={pill(sort === "reviews")}
              >
                Most reviews
              </button>
            </div>
          </div>

          <button
            onClick={() => update({ available: available ? null : "1" })}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className={`flex size-5 items-center justify-center rounded border ${
                available
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {available ? <Check className="size-3.5" /> : null}
            </span>
            Available now only
          </button>
        </div>
      ) : null}
    </div>
  );
}

function pill(active: boolean) {
  return `rounded-full px-3 py-1 text-sm transition-colors ${
    active
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-foreground hover:bg-secondary/70"
  }`;
}
