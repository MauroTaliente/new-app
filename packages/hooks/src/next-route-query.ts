'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  getObjectWithTag,
  removeTagFromObject,
  useRouteQueryCore,
  type RouteQueryPayload,
  type RouteQueryUpdateMode,
} from './route-query-shared.js';

export { getObjectWithTag, removeTagFromObject };
export type { RouteQueryPayload, RouteQueryUpdateMode };

/**
 * Query params helper scoped by `tag + sep`.
 *
 * Syncs URL query string with React state (Next.js App Router).
 */
export function useRouteQuery(tag = '', sep = '') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname || '/';
  }, [pathname, searchParams]);

  const applyUrl = useCallback(
    (url: string, mode: RouteQueryUpdateMode = 'silent') => {
      const finalUrl = url || pathname || '/';
      const currentUrl =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : route;

      if (currentUrl === finalUrl) return;
      if (mode === 'push') {
        router.push(finalUrl, { scroll: false });
        return;
      }
      if (mode === 'replace') {
        router.replace(finalUrl, { scroll: false });
        return;
      }

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', finalUrl);
      }
    },
    [pathname, route, router],
  );

  return useRouteQueryCore(tag, sep, { pathname: pathname || '/', searchParams, applyUrl });
}
