import Link from "next/link";
import { Clock } from "lucide-react";
import type { Service } from "@/lib/types";
import { formatUsd } from "@/lib/fees";
import { channelLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";

export function ServiceCard({
  service,
  expertId,
  bookable = true,
}: {
  service: Service;
  expertId: string;
  bookable?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-base font-semibold">{service.title}</h4>
        <span className="font-mono text-lg font-bold text-primary">
          {formatUsd(service.price_cents)}
        </span>
      </div>
      {service.description ? (
        <p className="flex-1 text-sm text-muted-foreground">
          {service.description}
        </p>
      ) : null}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{channelLabel(service.channel)}</span>
        {service.duration_minutes ? (
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {service.duration_minutes} min
          </span>
        ) : null}
      </div>
      {bookable ? (
        <Button
          className="mt-1 w-full"
          render={
            <Link href={`/experts/${expertId}/book?service=${service.id}`} />
          }
        >
          Book
        </Button>
      ) : null}
    </div>
  );
}
