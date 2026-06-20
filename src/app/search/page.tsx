import Link from "next/link";
import { getCategories, getClosestExperts, searchExperts } from "@/lib/queries";
import { SearchBar } from "@/components/search-bar";
import { ExpertCard } from "@/components/expert-card";
import { NotifyMeButton } from "@/components/notify-me-button";
import { Badge } from "@/components/ui/badge";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const [experts, categories] = await Promise.all([
    searchExperts({ q, category }),
    getCategories(),
  ]);
  const activeCategory = categories.find((c) => c.slug === category);
  const closest =
    experts.length === 0 ? await getClosestExperts(category) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SearchBar defaultValue={q ?? ""} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href="/search">
          <Badge variant={category ? "outline" : "default"}>All</Badge>
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/search?category=${c.slug}`}>
            <Badge variant={c.slug === category ? "default" : "outline"}>
              {c.name}
            </Badge>
          </Link>
        ))}
      </div>

      <h1 className="mt-6 mb-3 text-sm text-muted-foreground">
        {experts.length} {experts.length === 1 ? "pro" : "pros"}
        {q ? ` for “${q}”` : ""}
        {activeCategory ? ` in ${activeCategory.name}` : ""}
      </h1>

      {experts.length > 0 ? (
        <div className="grid gap-3">
          {experts.map((e) => (
            <ExpertCard key={e.id} expert={e} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No matching pros found. Try a different search or category.
          </p>

          {closest.length > 0 ? (
            <div>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Closest pros who might help
              </h2>
              <div className="grid gap-3">
                {closest.map((e) => (
                  <ExpertCard key={e.id} expert={e} />
                ))}
              </div>
            </div>
          ) : null}

          <NotifyMeButton query={q ?? ""} category={category ?? null} />
        </div>
      )}
    </div>
  );
}
