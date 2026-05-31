import type { QueryParamRaw } from './safe-int.js';

/**
 * Parse a URL query string value: absent/empty → `fallback`, otherwise the raw
 * string (trimmed). Not to be confused with `safeStringify` (JSON).
 */
export function safeString(raw: QueryParamRaw, fallback = ''): string {
  if (raw == null || raw === '') return fallback;
  return raw.trim();
}

/** Curried resolver for `useRouteQuery().getGroup({ search: queryString(), … })`. */
export function queryString(fallback = ''): (raw: QueryParamRaw) => string {
  return (raw) => safeString(raw, fallback);
}
