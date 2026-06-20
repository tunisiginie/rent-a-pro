import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ExpertProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";

export function ExpertCard({ expert }: { expert: ExpertProfile }) {
  return (
    <Link href={`/experts/${expert.id}`} className="block">
      <div className="group flex gap-4 rounded-xl bg-card p-5 transition-colors hover:bg-secondary/60">
        <Avatar className="size-16 shrink-0 ring-2 ring-border">
          {expert.photo_url ? (
            <AvatarImage src={expert.photo_url} alt="" />
          ) : null}
          <AvatarFallback className="text-sm font-semibold">
            {expert.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-base font-semibold">{expert.display_name}</h3>
                {expert.charges_enabled ? (
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                ) : null}
              </div>
              {expert.headline ? (
                <p className="truncate text-sm text-muted-foreground">
                  {expert.headline}
                </p>
              ) : null}
            </div>
            {expert.available_now ? (
              <Badge className="shrink-0 bg-success/15 text-success text-xs">
                Available now
              </Badge>
            ) : null}
          </div>
          <div className="mt-2">
            <RatingStars
              rating={expert.rating_avg}
              count={expert.rating_count}
            />
          </div>
          {expert.specialties.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {expert.specialties.slice(0, 3).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs font-normal">
                  {s}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
