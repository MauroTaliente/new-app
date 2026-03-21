'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Payload = Record<string, unknown>;
type UpdateMode = 'push' | 'replace' | 'silent';

export function getObjectWithTag<T extends Record<string, unknown>>(obj: T, tag: string, sep = '') {
  return Object.entries(obj).reduce(
    (pre, [key, value]) => ({ ...pre, [`${tag}${sep}${key}`]: value }),
    {} as T,
  );
}

export function removeTagFromObject<T extends Record<string, unknown>>(obj: T, tag: string, sep = ''): T {
  const tagWithSep = `${tag}${sep}`;
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = key.startsWith(tagWithSep) ? key.slice(tagWithSep.length) : key;
    return { ...acc, [newKey]: value };
  }, {} as T);
}

/**
 * Query params helper scoped by `tag + sep`.
 *
 * Syncs URL query string with React state (Next.js App Router).
 */
export function useRouteQuery(tag = '', sep = '') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const route = useMemo(() => {
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname || '/';
  }, [pathname, params]);

  const applyUrl = useCallback(
    (url: string, mode: UpdateMode = 'silent') => {
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

  const updateParams = useCallback(
    (payload: Payload, mode: UpdateMode = 'silent') => {
      const next = new URLSearchParams(searchParams);
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
    (payload: Payload, mode: UpdateMode = 'silent') => {
      updateParams(payload, mode);
    },
    [updateParams],
  );

  const set = useCallback(
    (payload: Payload, mode: UpdateMode = 'replace') => {
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
