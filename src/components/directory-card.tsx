import Link from "next/link";
import { MapPin } from "lucide-react";
import type { DirectoryExpert } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/** Search-result card for an auto-compiled (unclaimed) directory listing. */
export function DirectoryCard({ expert }: { expert: DirectoryExpert }) {
  return (
    <Link href={`/directory/${expert.id}`} className="block">
      <div className="flex gap-4 rounded-xl bg-card p-5 transition-colors hover:bg-secondary/60">
        <Avatar className="size-14 shrink-0 ring-2 ring-border">
          <AvatarFallback className="text-sm font-semibold">
            {expert.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold">{expert.display_name}</h3>
            <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
              Unclaimed
            </Badge>
          </div>
          {expert.headline ? (
            <p className="truncate text-sm text-muted-foreground">{expert.headline}</p>
          ) : null}
          {expert.location ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {expert.location}
            </p>
          ) : null}
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
