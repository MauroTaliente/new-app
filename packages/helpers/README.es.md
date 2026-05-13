# @maurotaliente/react-helpers

Utilidades sin dependencia de React: guards, `mergeDeepRight`, JSON seguro, lectura/escritura por rutas con segmentos `a/b` (y opcional `[índice]`), y helpers de fechas / calendario. Las usan otros paquetes `@maurotaliente/*`.

## Instalación (monorepo)

`"@maurotaliente/react-helpers": "workspace:*"`

Desde npm (tras publicar): mismo nombre con rango semver.

## Entry

`import { … } from '@maurotaliente/react-helpers'`

## Resumen

| Área | Ejemplos |
|------|-----------|
| Entorno | `IS_BROWSER` |
| Objetos / merge | `isObject`, `mergeDeepRight`, `isEmptyObject`, `isDeepEqual`, `sortDeep` |
| Primitivos y colecciones | `isString`, `isNumber`, `isInteger`, `isArray`, `isEmptyArray`, `isFunction`, `isAsyncFunction` |
| “Vacío” | `isNullOrEmpty`, `isEmpty`, `isNestedEmptyObject`, … |
| JSON | `safeParse`, `safeStringify`, `safeNumber` |
| Cadenas | `getFallback`, `normalizeString`, `capitalized` |
| Fechas y calendario | `formatTimestamp`, `toDateSafe`, `toLocalDateKey`, `isSameLocalDay`, `buildCalendarMonth`, … |
| Rutas | `getPathSegmentReady`, `getValueFromPath`, `mergeValueByPath`, `setValueByPath`, `removePathParts` |

La API completa está en `src/shared.ts` (incluye JSDoc en `mergeDeepRight`).

## Tests

`pnpm --filter @maurotaliente/react-helpers test`
