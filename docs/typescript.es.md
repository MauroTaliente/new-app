# TypeScript: puntos de entrada públicos

Importa **tipos** desde la misma entrada del paquete que usas en runtime (`@maurotaliente/react-networking`, `@maurotaliente/react-persistence`, etc.). Las tablas listan lo principal; el listado completo está en `src/index.ts` de cada paquete.

## `@maurotaliente/react-networking`

| Ámbito | Tipos (ejemplos) | Notas |
|--------|------------------|--------|
| Petición / respuesta HTTP | `RequestProps`, `RequestReturn`, `Request`, `LoadRequestProps`, `HttpMethod` | `RequestProps<Params>` tipa `body` como `Params` para JSON. |
| Hook de fetch en cliente | `DynamicOptions`, `DynamicModel`, `AsyncFetch`, `Action`, `Setter`, `ResponseOrData`, `Context` | Los defaults de `useAsyncFetch` están tipados; sobrescribe `action` / `setter` para APIs reales. |
| Caché de requests | `RequestCacheOption`, `RequestCachePreset`, `RequestCache`, `createRequestCache`, `defaultRequestCache`, `buildRequestCacheKey` | En apps conviene `requestCache: 'global'`; instancia aparte con `createRequestCache()` cuando haga falta. |
| Registro / codegen | Tipos desde `./types/api-registry` | Alineados con `apis.generated.ts` y hooks cliente. |

Los helpers de servidor (`request`, `createDataFlow`) y los hooks de cliente comparten estos modelos para que el código generado y el manual encajen.

## `@maurotaliente/react-persistence`

| Ámbito | Tipos (ejemplos) | Notas |
|--------|------------------|--------|
| Factory de storage | `StorageDriverOptions` | Para `createStorageApi`. |
| Cookies (navegador) | `CookieWriteOptions`, `CookieClientOptions` | Helpers de cookies en cliente. |
| Cookies (servidor / store) | `CookieStoreLike`, `ServerCookieOptions` | Para `getCookieFromStore` / `setCookieInStore`. |
| Puente con auth | `AuthProfile` | Re-exportado desde `@maurotaliente/react-networking` para props de carga HTTP. |

Los hooks (`useGetLocal`, …) infieren claves desde tu API de storage; las opciones documentan los parámetros configurables.

## `@maurotaliente/react-i18n`

| Ámbito | Tipos (ejemplos) | Notas |
|--------|------------------|--------|
| ICU / plurales | `formatMessage`, `MessageValues` | `intl-messageformat` por debajo. |

## `@maurotaliente/react-helpers`, `@maurotaliente/react-context`, `@maurotaliente/react-theme`, `@maurotaliente/react-styles`, `@maurotaliente/react-hooks`

Prefiere **imports con nombre** y el campo `types` / `exports` del `package.json` de cada paquete. Si un símbolo no sale del root del paquete, trátalo como interno salvo que el README del paquete diga lo contrario.

## `Expand` y firmas invocables

Los helpers internos como `Expand` pueden usar comprobaciones de función relajadas en tipos condicionales para que las **firmas invocables** de `Action` / `Setter` sigan siendo llamables. Eso no ensancha los tipos de tu aplicación: solo afecta cómo se expanden para inferencia y el IDE.
