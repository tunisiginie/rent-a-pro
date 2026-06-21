"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { pushRecentSearch } from "@/lib/recents";
import { logExperimentEvent } from "@/lib/actions/experiment";

export function SearchBar({
  defaultValue = "",
  placeholder = "Describe your problem, e.g. BMW won't start",
  variant,
}: {
  defaultValue?: string;
  placeholder?: string;
  /** Copy A/B variant key; logs a conversion when a search is submitted. */
  variant?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      pushRecentSearch(q);
      if (variant) logExperimentEvent(variant, "convert").catch(() => {});
    }
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} className="relative flex w-full items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Search for help"
          className="h-14 rounded-xl pl-11 pr-4 text-base shadow-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>
      <Button type="submit" size="lg" className="h-14 shrink-0 rounded-xl px-6 text-base font-semibold">
        Search
      </Button>
    </form>
  );
}
