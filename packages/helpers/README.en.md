# @react33/react-helpers

Runtime-agnostic utilities: guards, `mergeDeepRight`, safe JSON, slash-separated path getters/setters, and calendar/date helpers. No React dependency.

## Install (monorepo)

`"@react33/react-helpers": "workspace:*"`

From npm (after publish): use the same package name with a semver range.

## Entry

`import { … } from '@react33/react-helpers'`

## Router entry (`@react33/react-helpers/router`)

Parsers for `useRouteQuery().getGroup` resolvers — pair with **`@react33/react-hooks/router`**.

```ts
import { queryInt, safeInt } from '@react33/react-helpers/router';
import { useRouteQuery } from '@react33/react-hooks/router';
```

| Export | Notes |
|--------|--------|
| `safeInt` | `(raw, fallback, min?)` → positive integer from query string |
| `queryInt` | `(fallback, min?)` → resolver for `getGroup({ page: queryInt(1) })` |
| `safeString` | `(raw, fallback?)` → trimmed string (not `safeStringify`) |
| `queryString` | `(fallback?)` → resolver for `getGroup({ search: queryString() })` |
| `QueryParamRaw`, `RouteQueryRaw` | `string \| null` (absent param) |

## Highlights

| Area | Examples |
|------|-----------|
| Environment | `IS_BROWSER` |
| Objects / merge | `isObject`, `mergeDeepRight`, `isEmptyObject`, `isDeepEqual`, `sortDeep` |
| Primitives & collections | `isString`, `isNumber`, `isInteger`, `isArray`, `isEmptyArray`, `isFunction`, `isAsyncFunction` |
| Emptiness | `isNullOrEmpty`, `isEmpty`, `isNestedEmptyObject`, … |
| JSON | `safeParse`, `safeStringify`, `safeNumber` |
| Strings | `getFallback`, `normalizeString`, `capitalized` |
| Dates & calendar | `formatTimestamp`, `toDateSafe`, `toLocalDateKey`, `isSameLocalDay`, `buildCalendarMonth`, … |
| Paths (`a/b/c` segments, optional `[index]`) | `getPathSegmentReady`, `getValueFromPath`, `mergeValueByPath`, `setValueByPath`, `removePathParts` |

See `src/shared.ts` for the full surface and JSDoc on `mergeDeepRight`.

## Tests

`pnpm --filter @react33/react-helpers test`
