'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query; updates when the match changes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export type ColorSchemePreference = 'light' | 'dark';

/** Current OS / UA `prefers-color-scheme` (defaults to `light` on SSR). */
export function usePrefersColorScheme(): ColorSchemePreference {
  const dark = useMediaQuery('(prefers-color-scheme: dark)');
  return dark ? 'dark' : 'light';
}
