# @react33/react-persistence (Español)

Almacenamiento en navegador (localStorage, sessionStorage, cookies) y helpers opcionales para Next.js (cookie store).

## Storage versionado (`createVersionedStorageApi`)

Para claves cuyo JSON cambia en el tiempo, persistí **`{ _v: number, data: T }`** (opcional **`savedAt`** con TTL) y registrá migraciones **de un paso** `migrations[k]` de la versión `k` a `k + 1`. Valores **sin** `_v` se leen como versión **0** (todo el JSON parseado es `data`).

- **`getLocal` / `setLocal` / `putLocal`** misma ergonomía que `createStorageApi`, pero `data` es el payload de dominio.
- Tras migrar, se reescribe el envelope actual (write-through).
- Si una migración lanza error, o `_v` guardado es **mayor** que `currentVersion`, se usa **`initData`**.
- Opcional **`ttlMs`:** si es un número positivo, los writes incluyen `savedAt` (ms epoch). Las lecturas **borran** la clave y devuelven `initData` si el dato es más viejo que `ttlMs`. Envelopes **sin** `savedAt` **no** expiran.

## Cambios entre pestañas

`localStorage` se comparte entre pestañas del mismo origen. El evento **`storage`** del navegador avisa a las **otras** pestañas cuando cambia una clave (no a la que hizo `setItem`). Usá **`subscribeStorageKey(storage, key, handler)`** para reaccionar cuando otra pestaña actualiza una clave (p. ej. refrescar UI o invalidar cachés en memoria). Los cambios en la misma pestaña siguen requiriendo tu propio estado o `BroadcastChannel` si necesitás simetría.

## Cargadores de auth HTTP (`createLoadRequestPropsFromAuthProfile`)

`@react33/react-networking` define `createDataFlow` y los tipos **`AuthProfile`**. Este paquete **lee** el token en cookie o storage y fusiona cabeceras con `mergeRequestProps` / `buildHeadersFromTokenTemplate` de `@react33/react-networking`.

- **`createLoadRequestPropsFromAuthProfile(profile)`** — un `LoadRequestProps` por API.
- **`createLoadRequestPropsFromAuthProfiles(record)`** — mapa de loaders con nombre para `createApiRegistry(..., { loads })`.

Las cookies se leen con **`parseDocumentCookie`** para soportar JWT opacos (no solo JSON).

Tipo re-exportado: **`AuthProfile`** (desde `@react33/react-networking`).
