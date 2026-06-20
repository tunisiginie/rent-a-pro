"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useRecentCategories } from "@/lib/recents";
import type { Category } from "@/lib/types";

export function TopicsTile({ categories }: { categories: Category[] }) {
  const slugs = useRecentCategories();

  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const topics = slugs
    .map((s) => bySlug.get(s))
    .filter((c): c is Category => Boolean(c));

  return (
    <div className="flex min-h-40 flex-col rounded-2xl bg-gradient-to-br from-primary/20 to-card p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="size-4 text-primary" /> Topics you browse
      </div>
      {topics.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {topics.map((c) => (
            <Link
              key={c.id}
              href={`/search?category=${c.slug}`}
              className="rounded-full bg-secondary px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {c.name}
            </Link>
          ))}
        </div>
      ) : (
        <p className="my-auto text-sm text-muted-foreground">
          Categories you explore will be suggested here.
        </p>
      )}
    </div>
  );
}
