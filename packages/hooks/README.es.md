# @lib/hooks (Español)

Hooks reutilizables para React y utilidades pequeñas. Depende de `@lib/helpers` (p. ej. `mergeDeepRight` en helpers de viewport).

## Instalación (monorepo)

`"@lib/hooks": "workspace:*"`

### Convención `.ts` / `.tsx`

Solo **`.tsx`** si el archivo contiene **JSX**. Hooks sin JSX van en **`.ts`** (incluido `next-route-query.ts`).

### Tests

- **Carpeta:** `test/` en la raíz del paquete (no dentro de `src/`).
- **Nombres:** `*.spec.ts` (o `*.spec.tsx` si hay JSX). Imports: `../src/...`.
- **Herramienta:** Vitest + happy-dom + Testing Library (`renderHook`).

`pnpm --filter @lib/hooks test`

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

## Next.js (`@lib/hooks/next`)

| Export | Notas |
|--------|--------|
| `useRouteQuery` | Query ↔ estado |
| `getObjectWithTag`, `removeTagFromObject` | Helpers de query |

Requiere `next` en la app que importe este entry.

## Fuera de alcance a propósito

La capa de requests de la app está en **`@lib/networking`**. Tema e idioma: **`@lib/theme`**, **`@lib/persistence`**, **`@lib/i18n`**.

`useCssVariable` y `useBuildStyles` están en **`@lib/styles`**.
