/** Raw query param value before parsing (`null` = absent). */
export type QueryParamRaw = string | null;

/**
 * Parse a URL query string as a positive integer: floor, fallback on absent/invalid,
 * optional minimum (default `1`).
 */
export function safeInt(raw: QueryParamRaw, fallback: number, min = 1): number {
  if (raw == null || raw === '') return fallback;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, n);
}

/** Curried resolver for `useRouteQuery().getGroup({ page: queryInt(1), … })`. */
export function queryInt(fallback: number, min = 1): (raw: QueryParamRaw) => number {
  return (raw) => safeInt(raw, fallback, min);
}
