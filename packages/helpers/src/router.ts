/**
 * URL query parsing for `useRouteQuery().getGroup` resolvers.
 *
 * Use with `@react33/react-hooks/router` — same entry split as hooks (`/router`).
 */
export { queryInt, safeInt, type QueryParamRaw } from './safe-int.js';
export { queryString, safeString } from './safe-string.js';

/** Alias aligned with `RouteQueryRaw` from `@react33/react-hooks`. */
export type { QueryParamRaw as RouteQueryRaw } from './safe-int.js';
