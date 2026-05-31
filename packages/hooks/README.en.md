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

## React Router entry (`@react33/react-hooks/router`)

Same API as the Next entry, for Vite/SPA dashboards with **React Router v6+** (`react-router-dom`).

```ts
import { useRouteQuery } from '@react33/react-hooks/router';
```

Wrap the app with `BrowserRouter` / `RouterProvider` so `useNavigate` and `useSearchParams` are available.

| Export | Notes |
|--------|--------|
| `useRouteQuery` | URL query ↔ state; `add()` defaults to **`replace`** (`silent` is edge-only) |
| `getGroup` | Typed defaults (`string` / `number` / `boolean`) or **resolver** `(raw) => value` |
| `getObjectWithTag`, `removeTagFromObject` | Query helpers |

`getGroup` resolvers pair with **`@react33/react-helpers/router`**: `queryInt` / `safeInt`, `queryString` / `safeString`, etc.

Requires `react-router-dom` in the app that imports this entry.

### Why `replace` (not `silent`) as the default

`silent` calls `history.replaceState` directly. That **does not** fire `popstate` and **does not** update the router's internal state — so `useSearchParams` (both `react-router-dom` and `next/navigation`) returns stale values and any screen that derives state from the URL via a hook stays out of sync until a full reload. We hit this on Vite + react-router list screens and confirmed the same on Next 13+ App Router.

`replace` routes the update through the framework (`router.replace` / `navigate(..., { replace: true })`), which updates the address bar **and** notifies subscribers. No new history entry — same UX as `silent`, with hooks that actually re-render.

Use `silent` only when you intentionally bypass the router (a non-React widget, an embedded host, an analytics-only param you don't render).

## Out of scope (by design)

App-specific request wiring lives in **`@react33/react-networking`** (`useAsyncFetch`, generated `use*Request`). Theme and locale live in **`@react33/react-theme`**, **`@react33/react-persistence`**, and **`@react33/react-i18n`**.

`useCssVariable` and `useBuildStyles` live in **`@react33/react-styles`**.
