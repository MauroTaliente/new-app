# @lib/persistence (Español)

Almacenamiento en navegador (localStorage, sessionStorage, cookies) y helpers opcionales para Next.js (cookie store).

## Cargadores de auth HTTP (`createLoadRequestPropsFromAuthProfile`)

`@lib/networking` define `createDataFlow` y los tipos **`AuthProfile`**. Este paquete **lee** el token en cookie o storage y fusiona cabeceras con `mergeRequestProps` / `buildHeadersFromTokenTemplate` de `@lib/networking`.

- **`createLoadRequestPropsFromAuthProfile(profile)`** — un `LoadRequestProps` por API.
- **`createLoadRequestPropsFromAuthProfiles(record)`** — mapa de loaders con nombre para `createApiRegistry(..., { loads })`.

Las cookies se leen con **`parseDocumentCookie`** para soportar JWT opacos (no solo JSON).

Tipo re-exportado: **`AuthProfile`** (desde `@lib/networking`).
