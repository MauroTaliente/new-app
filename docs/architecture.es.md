# Arquitectura y límites

## Para qué sirve este monorepo

Un **kit compartido** para apps React (productos internos, demos, UIs nuevas): tokens tipados desde CSS, clientes HTTP + hooks, persistencia en navegador, i18n y primitivas React (`context`, `theme`). **No** es un framework de aplicación completo, un design system con componentes listos, ni un servidor i18n completo (ICU para mensajes sí; routing/locale queda en la app).

**Dentro del alcance:** codegen, caché opcional compartida en `useAsyncFetch`, una request en vuelo por instancia de hook por defecto, tokens alineados con CSS estilo Tailwind v4.

**Fuera de alcance (hoy):** integrar una librería de query de terceros por vos, o una librería de componentes.

## Mapa de paquetes (dirección de dependencias)

Misma estructura que [architecture.en.md](architecture.en.md) (diagrama `mermaid` en la versión EN). Las apps consumen solo lo necesario; `workspace:*` alinea versiones.

## Matriz SSR / cliente / servidor

Sirve para elegir el entry correcto y no importar código solo-cliente en RSC o bundles servidor.

| Paquete | Seguro en RSC / layout servidor | Componentes cliente (`'use client'`) | Notas |
|---------|--------------------------------|-------------------------------------|--------|
| `@react33/react-helpers` | Sí | Sí | Utilidades puras |
| `@react33/react-context` | No (contexto React) | Sí | Solo cliente |
| `@react33/react-styles` | Sí (tipos, `buildStyles`, tokens) | Sí (`useBuildStyles`, etc. en client) | El `styles` generado es código de app |
| `@react33/react-networking` | Sí: `request`, `createApiRegistry`, `fetch.server` | Sí: `useAsyncFetch`, `fetch.client` | No importar `fetch.client` en servidor |
| `@react33/react-persistence` | Sí: auth loaders, cookie store sin hooks | Sí: hooks `*.client.tsx` | Los hooks usan `useAsyncFetch` |
| `@react33/react-hooks` | Depende del hook | Sí en general | `next-route-query` requiere cliente Next |
| `@react33/react-i18n` | Sí: `getLocale`, `browser` (con APIs inyectadas en tests) | Sí: `@react33/react-i18n/next` (`next.client`) | `@react33/react-i18n/next/server` para loaders servidor |
| `@react33/react-theme` | Pasar `value` desde servidor; DOM no-op sin `document` | Sí: `createThemeRuntime` | Ver README del paquete para SSR |

**Regla:** archivos `*.client.tsx` y exports de `fetch.client` = **solo navegador + React cliente**.

## Contexto React y re-renders

`@react33/react-context` expone **`newContext`** con **`StateContext`** y **`DispatchContext`** separados para que el identity del dispatch sea estable. Eso evita un antipatrón habitual, pero **cualquier hook que lea el estado completo sigue re-renderizando cuando cambia cualquier parte de ese estado**—React no ofrece “selectores” nativos para contexto.

**Patrones prácticos:**

- Preferí **suscripciones acotadas**: derivá solo lo que el componente necesita (p. ej. `useMemo` sobre `useXState()` para un campo, o componentes hijos pequeños que lean un solo campo).
- En árboles calientes, **partí el estado** en varios providers o varios pares contexto/dispatch para que las hojas no dependan de slices ajenos.
- **No** asumas que separar dispatch del estado evita re-renders ante cada dispatch; quien usa el hook de estado sigue viendo el store completo.

Ver [README de @react33/react-context](../packages/context/README.es.md) para un ejemplo mínimo estilo selector.

## Convenciones recomendadas: loading / error / éxito

Defaults **documentados**; las APIs siguen siendo flexibles.

### `useAsyncFetch` (y `use*Request` generados)

- **`initialLoading`:** skeleton en primera carga (`loading && meta.success === 0`).
- **`loading`:** cualquier request en curso para esa instancia.
- **`data`:** último payload mapeado con `setter`.
- **`error`:** error lanzado o HTTP fallido.
- **`meta`:** triggers, éxitos, reintentos.

No confíes solo en **`status`** tras un ciclo exitoso; preferí **`data`** y **`meta.success`**.

### Hooks de persistencia

Mismo modelo mental que `useAsyncFetch`: `loading`, `error`, `data`. Usá `initData` cuando exista.

## Caché de requests opcional (`createRequestCache`)

`useAsyncFetch` ejecuta **`action`** (suele llamar a `apis.*` generado). Ahí encaja la caché, no un wrapper genérico de `fetch`.

- Usá **`requestCache: 'global'`** (singleton compartido, sin import) o una instancia **`RequestCache`** de **`createRequestCache()`** (tests, caché por feature, etc.), más opcional **`cacheTtlMs`**. Clave por defecto: `name` + `params` + `scope`; **`cacheKey`** para override.
- Sin TTL o `0`: solo **deduplicar en vuelo** la misma clave.
- `cacheTtlMs` &gt; 0: guardar el último **`RequestReturn` 2xx** en memoria hasta expirar; **`invalidate(key)`** para borrar.
- No reemplaza caché HTTP en servidor ni un grafo de invalidación completo.
- **Otra pestaña:** si otra pestaña cambia datos compartidos, podés escuchar `storage` y llamar **`defaultRequestCache.invalidate(key)`** (o tu instancia)—patrón opcional.

## Vías de escape

- **Networking:** `request` / `fetch` directo junto al registry; `action` custom en `useAsyncFetch`. `mergeRequestProps` sin registry completo.
- **Tema:** solo `value` + `onThemeChange`; la persistencia la definís vos.
- **i18n:** diccionarios planos; `getLocale` no exige Next.
- **Persistencia:** `createStorageApi` con `Storage` custom o doble de tests.

## TypeScript: entrada pública

Qué tipos importar desde `@react33/react-networking`, `@react33/react-persistence`, etc.: [typescript.es.md](typescript.es.md).

## Versionado (workspace)

Paquetes `@react33/react-*` en **0.0.x** alineados. Cambios rompientes: [CHANGELOG.md](../CHANGELOG.md).

## Rendimiento

- **Networking:** una request lógica en vuelo por **instancia** de `useAsyncFetch`. Podés usar el mismo **`requestCache: 'global'`** (o la misma instancia **`RequestCache`**) entre hooks para dedup/TTL con la misma clave; si no, varias instancias sin caché compartida.
- **Bundle:** importar desde entry points; tree-shaking según bundler.

Más detalle en [performance.es.md](performance.es.md).
