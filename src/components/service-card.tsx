import Link from "next/link";
import { Clock } from "lucide-react";
import type { Service } from "@/lib/types";
import { formatUsd } from "@/lib/fees";
import { channelLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card data-size="sm">
      <CardContent className="flex flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium">{service.title}</h4>
          <span className="font-mono font-semibold text-primary">
            {formatUsd(service.price_cents)}
          </span>
        </div>
        {service.description ? (
          <p className="text-sm text-muted-foreground">{service.description}</p>
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
            size="sm"
            className="mt-1 w-full"
            render={
              <Link href={`/experts/${expertId}/book?service=${service.id}`} />
            }
          >
            Book
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
