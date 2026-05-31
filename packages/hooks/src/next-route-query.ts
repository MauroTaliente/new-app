'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_ROUTE_QUERY_MODE,
  getObjectWithTag,
  removeTagFromObject,
  useRouteQueryCore,
  type RouteQueryPayload,
  type RouteQueryUpdateMode,
} from './route-query-shared.js';

export { getObjectWithTag, removeTagFromObject };
export type {
  RouteQueryGroupDefaults,
  RouteQueryGroupResult,
  RouteQueryPayload,
  RouteQueryRaw,
  RouteQueryResolver,
  RouteQueryUpdateMode,
} from './route-query-shared.js';

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
    (url: string, mode: RouteQueryUpdateMode = DEFAULT_ROUTE_QUERY_MODE) => {
      const finalUrl = url || pathname || '/';
      if (route === finalUrl) return;
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
