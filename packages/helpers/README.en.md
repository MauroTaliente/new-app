# @maurotaliente/react-helpers

Runtime-agnostic utilities: guards, `mergeDeepRight`, safe JSON, slash-separated path getters/setters, and calendar/date helpers. No React dependency.

## Install (monorepo)

`"@maurotaliente/react-helpers": "workspace:*"`

From npm (after publish): use the same package name with a semver range.

## Entry

`import { … } from '@maurotaliente/react-helpers'`

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

`pnpm --filter @maurotaliente/react-helpers test`
