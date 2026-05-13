# @react33/react-hooks

Reusable React hooks and small utilities. Depends on `@react33/react-helpers` (e.g. `mergeDeepRight` for adaptive viewport helpers).

## Install (monorepo)

`"@react33/react-hooks": "workspace:*"`

### `.ts` vs `.tsx`

Use **`.tsx`** only when the file contains **JSX**. Hooks without JSX use **`.ts`** (including `next-route-query.ts`).

### Tests

- **Folder:** `test/` at the package root (not under `src/`).
- **Names:** `*.spec.ts` or `*.spec.tsx`. Imports: `../src/...`.
- **Runner:** Vitest + happy-dom + Testing Library (`renderHook` where needed).

`pnpm --filter @react33/react-hooks test`

See [docs/testing.en.md](../../docs/testing.en.md) for `.spec` vs `.test`.

## Core exports

| Hook / util | Notes |
|-------------|--------|
| `useIsomorphicLayoutEffect` | `useLayoutEffect` in the browser, `useEffect` on the server |
| `useLatest` | Ref updated every render; used by the timer |
| `useTimer` | Countdown / stopwatch with `performance.now` |
| `parseCssLengthToPx` | `rem` / `px` → px (16px root) |
| `useWindowSize` | Current viewport width |
| `useResponsiveValue` | Pick a value from `{ xs, md, … }` by active breakpoint |
| `useActiveBreakpoint` | `[activeKey, flags, width]` |
| `useAdaptiveValueBySize` | Deep merge of nested config by breakpoint (`mergeDeepRight`) |
| `useMediaQuery` | Match media |
| `usePrefersColorScheme` | `prefers-color-scheme` |

## Next.js entry (`@react33/react-hooks/next`)

| Export | Notes |
|--------|--------|
| `useRouteQuery` | URL query ↔ state |
| `getObjectWithTag`, `removeTagFromObject` | Query helpers |

Requires `next` in the app that imports this entry.

## Out of scope (by design)

App-specific request wiring lives in **`@react33/react-networking`** (`useAsyncFetch`, generated `use*Request`). Theme and locale live in **`@react33/react-theme`**, **`@react33/react-persistence`**, and **`@react33/react-i18n`**.

`useCssVariable` and `useBuildStyles` live in **`@react33/react-styles`**.
