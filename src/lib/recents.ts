// Client-only personalization stored in localStorage. No backend - these
// power the home page "Recents" and "Topics you browse" tiles.

import { useSyncExternalStore } from "react";

const SEARCH_KEY = "rap_recent_searches";
const CATEGORY_KEY = "rap_recent_categories";
const MAX = 6;
const EMPTY: string[] = [];

function parse(raw: string | null): string[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : EMPTY;
  } catch {
    return EMPTY;
  }
}

function read(key: string): string[] {
  if (typeof window === "undefined") return EMPTY;
  return parse(window.localStorage.getItem(key));
}

function write(key: string, list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list.slice(0, MAX)));
    // Notify same-tab subscribers (the storage event only fires cross-tab).
    window.dispatchEvent(new Event("rap-recents"));
  } catch {
    // ignore quota / private-mode errors
  }
}

/** Most-recent-first, de-duplicated, capped. */
function push(key: string, value: string) {
  const v = value.trim();
  if (!v) return;
  const next = [v, ...read(key).filter((x) => x.toLowerCase() !== v.toLowerCase())];
  write(key, next);
}

export function pushRecentSearch(query: string) {
  push(SEARCH_KEY, query);
}

export function pushRecentCategory(slug: string) {
  push(CATEGORY_KEY, slug);
}

// ---- React hooks (useSyncExternalStore keeps SSR/CSR consistent and avoids
// the set-state-in-effect lint rule). Snapshots are cached per raw string so
// the returned reference stays stable between renders. ----

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("rap-recents", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("rap-recents", cb);
  };
}

function makeUseList(key: string) {
  let cache: { raw: string | null; val: string[] } = { raw: null, val: EMPTY };
  return function useList(): string[] {
    return useSyncExternalStore(
      subscribe,
      () => {
        const raw = window.localStorage.getItem(key);
        if (raw !== cache.raw) cache = { raw, val: parse(raw) };
        return cache.val;
      },
      () => EMPTY,
    );
  };
}

export const useRecentSearches = makeUseList(SEARCH_KEY);
export const useRecentCategories = makeUseList(CATEGORY_KEY);
