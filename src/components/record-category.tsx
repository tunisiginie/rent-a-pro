"use client";

import { useEffect } from "react";
import { pushRecentCategory } from "@/lib/recents";

/** Records a browsed category to localStorage for the home "Topics" tile. */
export function RecordCategory({ slug }: { slug: string }) {
  useEffect(() => {
    if (slug) pushRecentCategory(slug);
  }, [slug]);
  return null;
}
