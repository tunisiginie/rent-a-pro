"use client";

import { useEffect } from "react";
import { SearchBar } from "@/components/search-bar";
import { VoiceOrb } from "@/components/voice-orb";
import { useCopyVariant } from "@/lib/experiment";
import { logExperimentEvent } from "@/lib/actions/experiment";

export function ConciergeHero() {
  const variant = useCopyVariant();

  // Log one impression per assigned variant (per visit).
  useEffect(() => {
    logExperimentEvent(variant.key, "impression").catch(() => {});
  }, [variant.key]);

  return (
    <div className="flex flex-col items-center gap-7">
      <VoiceOrb variant={variant.key} />
      <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or type it
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="w-full">
        <SearchBar placeholder={variant.placeholder} variant={variant.key} />
      </div>
    </div>
  );
}
