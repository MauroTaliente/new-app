# @react33/react-hooks (Español)

Hooks reutilizables para React y utilidades pequeñas. Depende de `@react33/react-helpers` (p. ej. `mergeDeepRight` en helpers de viewport).

## Instalación (monorepo)

`"@react33/react-hooks": "workspace:*"`

### Convención `.ts` / `.tsx`

Solo **`.tsx`** si el archivo contiene **JSX**. Hooks sin JSX van en **`.ts`** (incluido `next-route-query.ts`).

### Tests

- **Carpeta:** `test/` en la raíz del paquete (no dentro de `src/`).
- **Nombres:** `*.spec.ts` (o `*.spec.tsx` si hay JSX). Imports: `../src/...`.
- **Herramienta:** Vitest + happy-dom + Testing Library (`renderHook`).

`pnpm --filter @react33/react-hooks test`

Convención `.spec` vs `.test`: [docs/testing.es.md](../../docs/testing.es.md).

## Núcleo

| Hook / util | Notas |
|-------------|--------|
| `useIsomorphicLayoutEffect` | `useLayoutEffect` en cliente, `useEffect` en servidor |
| `useLatest` | Ref actualizado cada render (usado por el timer) |
| `useTimer` | Cuenta regresiva / cronómetro con `performance.now` |
| `parseCssLengthToPx` | `rem`/`px` → px (raíz 16px) |
| `useWindowSize` | Ancho del viewport |
| `useResponsiveValue` | Valor según breakpoint activo |
| `useActiveBreakpoint` | `[clave activa, flags, ancho]` |
| `useAdaptiveValueBySize` | Merge profundo por breakpoint |
| `useMediaQuery` | Media query |
| `usePrefersColorScheme` | `prefers-color-scheme` |

## Next.js (`@react33/react-hooks/next`)

| Export | Notas |
|--------|--------|
| `useRouteQuery` | Query ↔ estado |
| `getObjectWithTag`, `removeTagFromObject` | Helpers de query |

Requiere `next` en la app que importe este entry.

## React Router (`@react33/react-hooks/router`)

Misma API que el entry de Next, para dashboards Vite/SPA con **React Router v6+** (`react-router-dom`).

```ts
import { useRouteQuery } from '@react33/react-hooks/router';
```

La app debe estar envuelta en `BrowserRouter` / `RouterProvider`.

| Export | Notas |
|--------|--------|
| `useRouteQuery` | Query ↔ estado; `add()` por defecto **`replace`** (`silent` solo casos edge) |
| `getGroup` | Defaults tipados (`string` / `number` / `boolean`) o **resolver** `(raw) => value` |
| `getObjectWithTag`, `removeTagFromObject` | Helpers de query |

Los resolvers de `getGroup` se complementan con **`@react33/react-helpers/router`**: `queryInt` / `safeInt`, `queryString` / `safeString`, etc.

Requiere `react-router-dom` en la app que importe este entry.

### Por qué el default es `replace` y no `silent`

`silent` llama `history.replaceState` directo. Eso **no** dispara `popstate` y **no** actualiza el estado interno del router — entonces `useSearchParams` (de `react-router-dom` y de `next/navigation`) devuelve valores viejos y cualquier pantalla que lea la URL por hook queda desincronizada hasta un reload completo. Lo pegamos en listas Vite + react-router y confirmamos el mismo comportamiento en Next 13+ App Router.

`replace` rutea el cambio por el framework (`router.replace` / `navigate(..., { replace: true })`), que actualiza la URL **y** notifica a los suscriptores. No agrega entry de history — misma UX que `silent`, pero con hooks que sí re-renderizan.

Usá `silent` sólo cuando saltás el router a propósito (un widget no-React, un host embebido, un param de analytics que no renderizás).

## Fuera de alcance a propósito

La capa de requests de la app está en **`@react33/react-networking`**. Tema e idioma: **`@react33/react-theme`**, **`@react33/react-persistence`**, **`@react33/react-i18n`**.

`useCssVariable` y `useBuildStyles` están en **`@react33/react-styles`**.
