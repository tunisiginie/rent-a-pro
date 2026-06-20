import Link from "next/link";
import { BadgeCheck, Briefcase } from "lucide-react";
import type { ExpertProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";

/** Large highlighted result card for the top match on the search page. */
export function FeaturedExpertCard({ expert }: { expert: ExpertProfile }) {
  return (
    <Link href={`/experts/${expert.id}`} className="block">
      <div className="rounded-2xl border border-primary/30 bg-card p-6 transition-colors hover:border-primary/60">
        <div className="flex items-start gap-4">
          <Avatar className="size-20 shrink-0 ring-2 ring-primary/30">
            {expert.photo_url ? <AvatarImage src={expert.photo_url} alt="" /> : null}
            <AvatarFallback className="text-lg font-semibold">
              {expert.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <RatingStars rating={expert.rating_avg} count={expert.rating_count} />
              {expert.available_now ? (
                <Badge className="shrink-0 bg-success/15 text-success">
                  Available now
                </Badge>
              ) : null}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <h2 className="truncate text-2xl font-bold">{expert.display_name}</h2>
              {expert.charges_enabled ? (
                <BadgeCheck className="size-5 shrink-0 text-primary" />
              ) : null}
            </div>
            {expert.headline ? (
              <p className="text-muted-foreground">{expert.headline}</p>
            ) : null}
            {expert.years_experience ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Briefcase className="size-4" />
                {expert.years_experience}+ years experience
              </p>
            ) : null}
          </div>
        </div>
        {expert.specialties.length > 0 ? (
          <p className="mt-4 text-sm">
            <span className="text-muted-foreground">Specialties: </span>
            {expert.specialties.join(", ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
