import { useCallback, useMemo } from 'react';

export type RouteQueryPayload = Record<string, unknown>;
/**
 * URL update mode:
 * - `push` — `router.push` (new history entry). User can navigate back.
 * - `replace` — `router.replace` / `navigate(..., { replace: true })`. **Default.**
 *   Updates the URL in place AND notifies the router, so `useSearchParams` (react-router
 *   and `next/navigation`) re-renders with the new params.
 * - `silent` — `window.history.replaceState` only. Does **not** fire `popstate`, so neither
 *   react-router's `useSearchParams` nor Next's `useSearchParams` re-read the URL. Use only
 *   when you intentionally bypass the router and read from `window.location` yourself
 *   (e.g. a non-React widget, an embedded host, or an analytics-only param you don't render).
 */
export type RouteQueryUpdateMode = 'push' | 'replace' | 'silent';

/**
 * Default for partial URL updates (`add`, `clean`, etc.).
 *
 * `replace` (not `silent`) because `history.replaceState` updates the address bar without
 * notifying React Router / Next — both hooks derive their state from the router, not from
 * `popstate`. With `silent` as default, list screens reading the URL via `useSearchParams`
 * stayed stale until a full reload. Verified on Vite + react-router-dom v6/v7 and Next 13+.
 */
export const DEFAULT_ROUTE_QUERY_MODE: RouteQueryUpdateMode = 'replace';

export function getObjectWithTag<T extends Record<string, unknown>>(
  obj: T,
  tag: string,
  sep = '',
) {
  return Object.entries(obj).reduce(
    (pre, [key, value]) => ({ ...pre, [`${tag}${sep}${key}`]: value }),
    {} as T,
  );
}

export function removeTagFromObject<T extends Record<string, unknown>>(
  obj: T,
  tag: string,
  sep = '',
): T {
  const tagWithSep = `${tag}${sep}`;
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = key.startsWith(tagWithSep) ? key.slice(tagWithSep.length) : key;
    return { ...acc, [newKey]: value };
  }, {} as T);
}

export type RouteQuerySearchParams = {
  get(name: string): string | null;
  has(name: string): boolean;
  toString(): string;
};

/** Raw query value passed to `getGroup` resolvers (`null` = param absent). */
export type RouteQueryRaw = string | null;

export type RouteQueryResolver<T> = (raw: RouteQueryRaw) => T;

type RouteQueryGroupDefault =
  | string
  | number
  | boolean
  | RouteQueryResolver<unknown>;

export type RouteQueryGroupDefaults = Record<string, RouteQueryGroupDefault>;

type InferRouteQueryValue<D> = D extends RouteQueryResolver<infer R>
  ? R
  : D extends string
    ? string
    : D extends number
      ? number
      : D extends boolean
        ? boolean
        : unknown;

export type RouteQueryGroupResult<T extends RouteQueryGroupDefaults> = {
  [K in keyof T]: InferRouteQueryValue<T[K]>;
};

export type UseRouteQueryCoreOptions = {
  pathname: string;
  searchParams: RouteQuerySearchParams;
  applyUrl: (url: string, mode?: RouteQueryUpdateMode) => void;
};

/**
 * Shared query-param state synced with the URL (framework adapters supply navigation).
 */
export function useRouteQueryCore(
  tag: string,
  sep: string,
  { pathname, searchParams, applyUrl }: UseRouteQueryCoreOptions,
) {
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const route = useMemo(() => {
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname || '/';
  }, [pathname, params]);

  const updateParams = useCallback(
    (payload: RouteQueryPayload, mode: RouteQueryUpdateMode = DEFAULT_ROUTE_QUERY_MODE) => {
      const next = new URLSearchParams(searchParams.toString());
      const tagged = getObjectWithTag(payload, tag, sep);
      let hasChanges = false;

      Object.entries(tagged).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          if (next.has(key)) {
            next.delete(key);
            hasChanges = true;
          }
          return;
        }

        const nextValue = String(value);
        if (next.get(key) !== nextValue) {
          next.set(key, nextValue);
          hasChanges = true;
        }
      });

      if (!hasChanges) return;
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname || '/';
      applyUrl(url, mode);
    },
    [applyUrl, pathname, searchParams, sep, tag],
  );

  /**
   * Merge query keys into the current URL. See {@link RouteQueryUpdateMode} for mode semantics.
   * Default is `replace` so `useSearchParams` re-renders with the new params.
   */
  const add = useCallback(
    (payload: RouteQueryPayload, mode: RouteQueryUpdateMode = DEFAULT_ROUTE_QUERY_MODE) => {
      updateParams(payload, mode);
    },
    [updateParams],
  );

  const set = useCallback(
    (payload: RouteQueryPayload, mode: RouteQueryUpdateMode = 'replace') => {
      updateParams(payload, mode);
    },
    [updateParams],
  );

  const clean = useCallback(() => {
    const url = pathname || '/';
    applyUrl(url, 'replace');
  }, [applyUrl, pathname]);

  const get = useCallback(
    (name: string) => searchParams.get(`${tag}${sep}${name}`),
    [searchParams, tag, sep],
  );

  const getGroup = useCallback(
    <T extends RouteQueryGroupDefaults>(defaults: T): RouteQueryGroupResult<T> => {
      const acc = Object.fromEntries(
        Object.entries(defaults).map(([key, def]) => {
          const raw = searchParams.get(`${tag}${sep}${key}`);
          if (typeof def === 'function') {
            return [key, (def as RouteQueryResolver<unknown>)(raw)];
          }
          if (typeof def === 'boolean') return [key, raw ? raw === 'true' : def];
          if (typeof def === 'number') return [key, raw != null ? Number(raw) : def];
          return [key, raw ?? def];
        }),
      ) as RouteQueryGroupResult<T>;
      return removeTagFromObject(acc, tag, sep);
    },
    [searchParams, tag, sep],
  );

  return { set, add, get, getGroup, clean, route, params };
}
