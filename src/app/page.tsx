import Link from "next/link";
import { getCategories, searchExperts } from "@/lib/queries";
import { SearchBar } from "@/components/search-bar";
import { CategoryCard } from "@/components/category-card";
import { ExpertCard } from "@/components/expert-card";
import { RecentsTile } from "@/components/recents-tile";
import { TopicsTile } from "@/components/topics-tile";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    searchExperts(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          What do you need help with?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Describe your problem and get matched with a verified expert for a
          call, video chat, or quick answer.
        </p>
        <div className="mt-7">
          <SearchBar />
        </div>
      </section>

      <section className="mt-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <RecentsTile />
          <TopicsTile categories={categories} />
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top-rated pros</h2>
          <Link href="/search" className="text-sm text-primary hover:underline">
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
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No experts yet. Once pros sign up and are approved, they&rsquo;ll
            appear here.
          </p>
        )}
      </section>
    </div>
  );
}
