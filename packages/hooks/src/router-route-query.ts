import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
    (url: string, mode: RouteQueryUpdateMode = 'silent') => {
      const finalUrl = url || pathname || '/';
      const currentUrl =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : route;

      if (currentUrl === finalUrl) return;
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
