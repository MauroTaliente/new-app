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

## Fuera de alcance a propósito

La capa de requests de la app está en **`@react33/react-networking`**. Tema e idioma: **`@react33/react-theme`**, **`@react33/react-persistence`**, **`@react33/react-i18n`**.

`useCssVariable` y `useBuildStyles` están en **`@react33/react-styles`**.
