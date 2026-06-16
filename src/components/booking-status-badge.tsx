import type { BookingStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const STYLES: Record<BookingStatus, { label: string; className: string }> = {
  requested: { label: "Awaiting response", className: "bg-warning/15 text-warning" },
  accepted: { label: "Accepted", className: "bg-success/15 text-success" },
  scheduled: { label: "Scheduled", className: "bg-success/15 text-success" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
  declined: { label: "Declined", className: "bg-destructive/15 text-destructive" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const s = STYLES[status];
  return <Badge className={s.className}>{s.label}</Badge>;
}
