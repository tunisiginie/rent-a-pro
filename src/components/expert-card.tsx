import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ExpertProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/rating-stars";

export function ExpertCard({ expert }: { expert: ExpertProfile }) {
  return (
    <Link href={`/experts/${expert.id}`} className="block">
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="flex gap-4 p-4">
          <Avatar className="size-14">
            {expert.photo_url ? (
              <AvatarImage src={expert.photo_url} alt="" />
            ) : null}
            <AvatarFallback>
              {expert.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold">{expert.display_name}</h3>
              {expert.charges_enabled ? (
                <BadgeCheck className="size-4 shrink-0 text-primary" />
              ) : null}
            </div>
            {expert.headline ? (
              <p className="truncate text-sm text-muted-foreground">
                {expert.headline}
              </p>
            ) : null}
            <div className="mt-1.5">
              <RatingStars
                rating={expert.rating_avg}
                count={expert.rating_count}
              />
            </div>
            {expert.specialties.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {expert.specialties.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          {expert.available_now ? (
            <Badge className="h-fit shrink-0 bg-success/15 text-success">
              Available now
            </Badge>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
