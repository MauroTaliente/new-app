# @react33/react-helpers

Utilidades sin dependencia de React: guards, `mergeDeepRight`, JSON seguro, lectura/escritura por rutas con segmentos `a/b` (y opcional `[índice]`), y helpers de fechas / calendario. Las usan otros paquetes `@react33/*`.

## Instalación (monorepo)

`"@react33/react-helpers": "workspace:*"`

Desde npm (tras publicar): mismo nombre con rango semver.

## Entry

`import { … } from '@react33/react-helpers'`

## Entry router (`@react33/react-helpers/router`)

Parsers para resolvers de `getGroup` — usar junto a **`@react33/react-hooks/router`**.

```ts
import { queryInt, safeInt } from '@react33/react-helpers/router';
import { useRouteQuery } from '@react33/react-hooks/router';
```

| Export | Notas |
|--------|--------|
| `safeInt` | `(raw, fallback, min?)` → entero desde query string |
| `queryInt` | `(fallback, min?)` → resolver para `getGroup({ page: queryInt(1) })` |
| `safeString` | `(raw, fallback?)` → string recortado (no es `safeStringify`) |
| `queryString` | `(fallback?)` → resolver para `getGroup({ search: queryString() })` |
| `QueryParamRaw`, `RouteQueryRaw` | `string \| null` (param ausente) |

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

`pnpm --filter @react33/react-helpers test`
