# @lib/hooks

Reusable React hooks and small utilities. Depends on `@lib/helpers` (e.g. `mergeDeepRight` for adaptive viewport helpers).

## Install (monorepo)

`"@lib/hooks": "workspace:*"`

### `.ts` vs `.tsx`

Use **`.tsx`** only when the file contains **JSX**. Hooks without JSX use **`.ts`** (including `next-route-query.ts`).

### Tests

- **Folder:** `test/` at the package root (not under `src/`).
- **Names:** `*.spec.ts` or `*.spec.tsx`. Imports: `../src/...`.
- **Runner:** Vitest + happy-dom + Testing Library (`renderHook` where needed).

`pnpm --filter @lib/hooks test`

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

## Next.js entry (`@lib/hooks/next`)

| Export | Notes |
|--------|--------|
| `useRouteQuery` | URL query ↔ state |
| `getObjectWithTag`, `removeTagFromObject` | Query helpers |

Requires `next` in the app that imports this entry.

## Out of scope (by design)

App-specific request wiring lives in **`@lib/networking`** (`useAsyncFetch`, generated `use*Request`). Theme and locale live in **`@lib/theme`**, **`@lib/persistence`**, and **`@lib/i18n`**.

`useCssVariable` and `useBuildStyles` live in **`@lib/styles`**.
