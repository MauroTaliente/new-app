import { useCallback, useMemo } from 'react';

export type RouteQueryPayload = Record<string, unknown>;
export type RouteQueryUpdateMode = 'push' | 'replace' | 'silent';

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
    (payload: RouteQueryPayload, mode: RouteQueryUpdateMode = 'silent') => {
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

  const add = useCallback(
    (payload: RouteQueryPayload, mode: RouteQueryUpdateMode = 'silent') => {
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
    <T extends Record<string, unknown>>(defaults: T): T => {
      const acc = Object.fromEntries(
        Object.entries(defaults).map(([key, def]) => {
          const raw = searchParams.get(`${tag}${sep}${key}`);
          if (typeof def === 'boolean') return [key, raw ? raw === 'true' : def];
          if (typeof def === 'number') return [key, raw != null ? Number(raw) : def];
          return [key, raw ?? def];
        }),
      ) as T;
      return removeTagFromObject(acc, tag, sep);
    },
    [searchParams, tag, sep],
  );

  return { set, add, get, getGroup, clean, route, params };
}
