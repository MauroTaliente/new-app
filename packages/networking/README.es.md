# @maurotaliente/react-networking (Español)

Utilidades HTTP para navegador y servidor, hook **`useAsyncFetch`** (una petición en vuelo por instancia), **bus de eventos**, y generación de **registro de APIs** desde `lib.config.json`.

## Generador

Declará **`libNetworking.apis`** como objeto (nombre → `{ url, headers?, … }`). Definí **`libNetworking.output`** con la ruta de **`apis.generated.ts`** (relativa al `lib.config.json`). El módulo de hooks cliente se llama **`apis.client.generated.tsx`** (u otra ruta si usás **`hooksOutput`**).

Ejecutá **`react-networking-generate --config lib.config.json`**. El flag **`--output`** sobrescribe **`output`** del JSON.

## Documentación completa

Ver [README.en.md](README.en.md) (inglés, referencia completa de `useAsyncFetch`, `createApiRegistry`, auth, ejemplos).
