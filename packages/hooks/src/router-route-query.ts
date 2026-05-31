import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
 * Syncs URL query string with React state (React Router — Vite/SPA dashboards).
 */
export function useRouteQuery(tag = '', sep = '') {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const route = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname || '/';
  }, [pathname, searchParams]);

  const applyUrl = useCallback(
    (url: string, mode: RouteQueryUpdateMode = DEFAULT_ROUTE_QUERY_MODE) => {
      const finalUrl = url || pathname || '/';
      // Compare against router state, not `window.location` — in tests (and some
      // embedded hosts) the address bar can lag behind `useSearchParams`.
      if (route === finalUrl) return;
      if (mode === 'push') {
        navigate(finalUrl);
        return;
      }
      if (mode === 'replace') {
        navigate(finalUrl, { replace: true });
        return;
      }

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', finalUrl);
      }
    },
    [navigate, pathname, route],
  );

  return useRouteQueryCore(tag, sep, { pathname: pathname || '/', searchParams, applyUrl });
}
