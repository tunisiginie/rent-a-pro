import { SearchX } from "lucide-react";
import {
  getCategories,
  getClosestExperts,
  searchDirectoryExperts,
  searchExperts,
} from "@/lib/queries";
import { sendDemandEmail } from "@/lib/email";
import { SearchBar } from "@/components/search-bar";
import { ExpertCard } from "@/components/expert-card";
import { FeaturedExpertCard } from "@/components/featured-expert-card";
import { DirectoryCard } from "@/components/directory-card";
import { SearchFilters } from "@/components/search-filters";
import { RecordCategory } from "@/components/record-category";
import { NotifyMeButton } from "@/components/notify-me-button";
import { RequestSpecificExpert } from "@/components/request-specific-expert";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    available?: string;
    sort?: string;
  }>;
}) {
  const { q, category, available, sort } = await searchParams;
  const [experts, directory, categories] = await Promise.all([
    searchExperts({
      q,
      category,
      availableNow: available === "1",
      sort: sort === "reviews" ? "reviews" : "rating",
    }),
    searchDirectoryExperts({ q, category }),
    getCategories(),
  ]);
  const activeCategory = categories.find((c) => c.slug === category);
  const hasClaimed = experts.length > 0;
  const hasAny = hasClaimed || directory.length > 0;
  const closest = hasAny ? [] : await getClosestExperts(category);

  // Auto-alert the owner only when we truly have nothing (no-ops without RESEND_API_KEY).
  if (!hasAny && (q || category)) {
    await sendDemandEmail({
      query: q ?? null,
      categorySlug: category ?? null,
      autoTriggered: true,
    });
  }

  const [first, ...rest] = experts;
  const total = experts.length + directory.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {category ? <RecordCategory slug={category} /> : null}
      <SearchBar defaultValue={q ?? ""} />

      <div className="mt-5">
        <SearchFilters categories={categories} />
      </div>

      <p className="mt-6 mb-4 text-sm text-muted-foreground">
        {total} {total === 1 ? "pro" : "pros"}
        {q ? ` for "${q}"` : ""}
        {activeCategory ? ` in ${activeCategory.name}` : ""}
      </p>

      {hasAny ? (
        <div className="space-y-6">
          {hasClaimed ? (
            <>
              <FeaturedExpertCard expert={first} />
              {rest.length > 0 ? (
                <div>
                  <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                    Other certified pros
                  </h2>
                  <div className="space-y-2">
                    {rest.map((e) => (
                      <ExpertCard key={e.id} expert={e} />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {directory.length > 0 ? (
            <div>
              <h2 className="mb-1 text-sm font-medium text-muted-foreground">
                {hasClaimed ? "More pros we found" : "Pros we found for you"}
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Not on Rent a Pro yet &mdash; tap any to have us connect you.
              </p>
              <div className="space-y-2">
                {directory.map((d) => (
                  <DirectoryCard key={d.id} expert={d} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Empty state */}
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <SearchX className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">
                No pros found{q ? ` for "${q}"` : activeCategory ? ` in ${activeCategory.name}` : ""}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                We don&rsquo;t have a match yet, but we&rsquo;re growing fast.
              </p>
            </div>
          </div>

          {/* Closest pros fallback */}
          {closest.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Closest pros who might help
              </p>
              <div className="space-y-2">
                {closest.map((e) => (
                  <ExpertCard key={e.id} expert={e} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Demand capture CTAs */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-card p-6">
            <p className="text-sm font-medium">Want us to find someone for you?</p>
            <NotifyMeButton query={q ?? ""} category={category ?? null} />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <RequestSpecificExpert query={q ?? ""} category={category ?? null} />
          </div>
        </div>
      )}
    </div>
  );
}
