"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAvailabilitySlot } from "@/lib/actions/expert";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 - 21:00

function hourLabel(h: number) {
  const period = h < 12 ? "a" : "p";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
}

function key(day: number, hour: number) {
  return `${day}-${hour}`;
}

export function WeeklyAvailabilityGrid({
  slots,
}: {
  slots: { day_of_week: number; start_time: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<Set<string>>(
    () => new Set(slots.map((s) => key(s.day_of_week, Number(s.start_time.slice(0, 2))))),
  );

  function toggle(day: number, hour: number) {
    const k = key(day, hour);
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
    const fd = new FormData();
    fd.set("day_of_week", String(day));
    fd.set("hour", String(hour));
    startTransition(async () => {
      await toggleAvailabilitySlot(fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Tap the hours you&rsquo;re available each week.
      </p>
      <div
        className={`overflow-x-auto rounded-xl border border-border p-2 ${
          pending ? "opacity-70" : ""
        }`}
      >
        <div className="min-w-[34rem]">
          {/* header */}
          <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-1">
            <div />
            {DAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          {/* rows */}
          {HOURS.map((h) => (
            <div
              key={h}
              className="grid grid-cols-[3rem_repeat(7,1fr)] items-center gap-1"
            >
              <div className="pr-1 text-right text-xs text-muted-foreground">
                {hourLabel(h)}
              </div>
              {DAYS.map((_, day) => {
                const on = active.has(key(day, h));
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggle(day, h)}
                    aria-pressed={on}
                    className={`h-7 rounded-md transition-colors ${
                      on
                        ? "bg-primary hover:bg-primary/80"
                        : "bg-secondary hover:bg-secondary/60"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
