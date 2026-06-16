import Link from "next/link";
import { getCategories, searchExperts } from "@/lib/queries";
import { SearchBar } from "@/components/search-bar";
import { CategoryCard } from "@/components/category-card";
import { ExpertCard } from "@/components/expert-card";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    searchExperts(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          What do you need help with?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your problem and get matched with a verified expert for a
          call, video chat, or quick answer.
        </p>
        <div className="mt-6">
          <SearchBar />
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Browse by category
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Top-rated pros
          </h2>
          <Link
            href="/search"
            className="text-sm text-primary hover:underline"
          >
            See all
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.slice(0, 6).map((e) => (
              <ExpertCard key={e.id} expert={e} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No experts yet. Once pros sign up and are approved, they’ll appear
            here.
          </p>
        )}
      </section>
    </div>
  );
}
