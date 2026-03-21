import { sortDeep } from '@maurotaliente/react-helpers';
import type { RequestReturn } from '../types/models';

export type RequestCache = {
  /**
   * Runs `execute`, deduplicating in-flight work by `key`. If `ttlMs > 0`, caches
   * successful `RequestReturn` (status 2xx) until expiry. Errors are not cached.
   */
  run: <T>(key: string, ttlMs: number | undefined, execute: () => Promise<T>) => Promise<T>;
  /** Remove memory entry for `key`, or all memory entries if `key` is omitted. */
  invalidate: (key?: string) => void;
  clear: () => void;
};

/** Built-in cache selection for `useAsyncFetch` (avoids importing `defaultRequestCache` in app code). */
export type RequestCachePreset = 'global';

/** `'global'` = shared process singleton; or pass a `RequestCache` from `createRequestCache()` for a dedicated instance. */
export type RequestCacheOption = RequestCachePreset | RequestCache;

function isSuccessfulRequestReturn(res: unknown): res is RequestReturn<unknown> {
  if (res === null || typeof res !== 'object') return false;
  const s = (res as RequestReturn).status;
  return typeof s === 'number' && s >= 200 && s < 300;
}

/**
 * Stable key from hook identity + params (+ optional scope). Uses deep-sorted JSON.
 */
export function buildRequestCacheKey(name: string, params: unknown, scope?: string): string {
  const parts = scope === undefined ? [name, params] : [name, scope, params];
  return JSON.stringify(sortDeep(parts));
}

/** Shared instance for optional dedup/TTL without wiring a custom cache. */
export const defaultRequestCache: RequestCache = createRequestCache();

export function createRequestCache(): RequestCache {
  const inflight = new Map<string, Promise<unknown>>();
  const store = new Map<string, { value: unknown; expiresAt: number }>();

  return {
    async run<T>(key: string, ttlMs: number | undefined, execute: () => Promise<T>): Promise<T> {
      const wantMemory = ttlMs !== undefined && ttlMs > 0;

      if (wantMemory) {
        const hit = store.get(key);
        if (hit && hit.expiresAt > Date.now()) {
          return hit.value as T;
        }
      }

      const existing = inflight.get(key) as Promise<T> | undefined;
      if (existing) {
        return existing;
      }

      const p = (async () => {
        const result = await execute();
        if (wantMemory && isSuccessfulRequestReturn(result)) {
          store.set(key, { value: result, expiresAt: Date.now() + (ttlMs as number) });
        }
        return result;
      })() as Promise<T>;

      inflight.set(key, p);
      try {
        return await p;
      } finally {
        inflight.delete(key);
      }
    },

    invalidate(key?: string) {
      if (key === undefined) {
        store.clear();
        return;
      }
      store.delete(key);
    },

    clear() {
      inflight.clear();
      store.clear();
    },
  };
}
