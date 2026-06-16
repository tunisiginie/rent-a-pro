import Link from "next/link";
import { getCategories, searchExperts } from "@/lib/queries";
import { SearchBar } from "@/components/search-bar";
import { ExpertCard } from "@/components/expert-card";
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
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No matching pros found. Try a different search or category.
        </p>
      )}
    </div>
  );
}
