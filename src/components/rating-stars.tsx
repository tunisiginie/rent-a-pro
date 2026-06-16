import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating with an optional review count. */
export function RatingStars({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i < rounded
                ? "fill-warning text-warning"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        ))}
      </div>
      {count !== undefined ? (
        <span className="text-muted-foreground">
          {rating > 0 ? rating.toFixed(1) : "New"}
          {count > 0 ? ` (${count})` : ""}
        </span>
      ) : null}
    </div>
  );
}
