import Link from "next/link";
import { SearchX } from "lucide-react";
import { getCategories, getClosestExperts, searchExperts } from "@/lib/queries";
import { sendDemandEmail } from "@/lib/email";
import { SearchBar } from "@/components/search-bar";
import { ExpertCard } from "@/components/expert-card";
import { NotifyMeButton } from "@/components/notify-me-button";
import { RequestSpecificExpert } from "@/components/request-specific-expert";
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

  // Auto-alert the owner on every empty search (no-ops without RESEND_API_KEY).
  if (experts.length === 0 && (q || category)) {
    await sendDemandEmail({
      query: q ?? null,
      categorySlug: category ?? null,
      autoTriggered: true,
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SearchBar defaultValue={q ?? ""} />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link href="/search">
          <Badge variant={category ? "outline" : "default"} className="rounded-full px-3 py-1">
            All
          </Badge>
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/search?category=${c.slug}`}>
            <Badge
              variant={c.slug === category ? "default" : "outline"}
              className="rounded-full px-3 py-1"
            >
              {c.name}
            </Badge>
          </Link>
        ))}
      </div>

      <p className="mt-6 mb-4 text-sm text-muted-foreground">
        {experts.length} {experts.length === 1 ? "pro" : "pros"}
        {q ? ` for "${q}"` : ""}
        {activeCategory ? ` in ${activeCategory.name}` : ""}
      </p>

      {experts.length > 0 ? (
        <div className="space-y-2">
          {experts.map((e) => (
            <ExpertCard key={e.id} expert={e} />
          ))}
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
                We don&rsquo;t have a match yet — but we&rsquo;re growing fast.
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
