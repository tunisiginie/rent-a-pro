// Home-page copy A/B test. Each visitor is assigned one professional wording
// variant (stable in localStorage) so we can see which converts best. Reads use
// useSyncExternalStore to stay SSR/CSR-consistent and avoid set-state-in-effect.

import { useSyncExternalStore } from "react";

export interface CopyVariant {
  key: string;
  /** The professional word under test. */
  term: string;
  /** Full search-box placeholder for this variant. */
  placeholder: string;
}

export const COPY_VARIANTS: CopyVariant[] = [
  {
    key: "consultation",
    term: "consultation",
    placeholder: "Describe your problem, or the consultation you need...",
  },
  {
    key: "expert-guidance",
    term: "expert guidance",
    placeholder: "Describe your problem, or the expert guidance you're after...",
  },
  {
    key: "advisory",
    term: "advisory",
    placeholder: "Describe your problem, or the advisory you need...",
  },
  {
    key: "counsel",
    term: "counsel",
    placeholder: "Describe your problem, or the counsel you're seeking...",
  },
];

const KEY = "rap_copy_variant";
const DEFAULT = COPY_VARIANTS[0];

function variantByKey(key: string | null): CopyVariant {
  return COPY_VARIANTS.find((v) => v.key === key) ?? DEFAULT;
}

/** Assigns (once) and returns the visitor's stable variant key. */
function ensureAssigned(): string {
  if (typeof window === "undefined") return DEFAULT.key;
  try {
    let key = window.localStorage.getItem(KEY);
    if (!key || !COPY_VARIANTS.some((v) => v.key === key)) {
      key = COPY_VARIANTS[Math.floor(Math.random() * COPY_VARIANTS.length)].key;
      window.localStorage.setItem(KEY, key);
      window.dispatchEvent(new Event("rap-experiment"));
    }
    return key;
  } catch {
    return DEFAULT.key;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("rap-experiment", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("rap-experiment", cb);
  };
}

let cache: { key: string | null; val: CopyVariant } = { key: null, val: DEFAULT };

/** React hook: the visitor's assigned copy variant (DEFAULT during SSR). */
export function useCopyVariant(): CopyVariant {
  return useSyncExternalStore(
    subscribe,
    () => {
      const key = ensureAssigned();
      if (key !== cache.key) cache = { key, val: variantByKey(key) };
      return cache.val;
    },
    () => DEFAULT,
  );
}
