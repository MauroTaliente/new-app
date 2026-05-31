# @react33/react-networking (Español)

Utilidades HTTP para navegador y servidor, hook **`useAsyncFetch`** (una petición en vuelo por instancia), **bus de eventos**, y generación de **registro de APIs** y **OpenAPI 3.1+** desde `react33.config.json`.

### `useAsyncFetch` (contrato v2)

- **`trigger(params?)`** — único disparador de red (GET y POST); sin `params` en las options del hook.
- **`fetchOnMount`** — un GET opcional al montar (usa `memo.params` actual, normalmente tras un `trigger`).
- Sin segundo argumento `watch`, sin `mapWatchToParams`.
- GET reactivos (URL/filtros): **`useEffect(() => trigger(params), deps)`** en el componente (sin wrappers).

Detalle y ejemplos: [README.en.md](README.en.md#useasyncfetch).

## Generador de APIs (`apis`)

Declará **`react33Networking.apis`** como objeto (nombre → `{ url, headers?, … }`). Definí **`react33Networking.registryOutput`** con la ruta de **`apis.generated.ts`** (relativa al `react33.config.json`). El módulo de hooks cliente por defecto es **`apis.client.generated.tsx`** (u otra ruta con **`hooksOutput`**).

Ejecutá **`react-networking-generate --config react33.config.json`** o **`react-generate`**. El flag **`--output`** sobrescribe **`registryOutput`** del JSON.

## OpenAPI 3.1 codegen

Añadí **`react33Networking.openApi.files`** (ver schema en `@react33/react-config`). Cada entrada apunta a un YAML/JSON **≥ 3.1**, un **`scope`** existente en `apis`, y rutas de salida:

| Salida | Contenido |
|--------|-----------|
| `*.openapi.zod.ts` | Schemas Zod (validación en runtime; forms) |
| `*.openapi.types.ts` | `z.infer` + `{Operación}HookOverrides` |
| `*.openapi.ts` | SDK server-safe (`pokemonList`, …) → `{scope}Request` |
| `*.openapi.client.tsx` | `usePokemonList`, … vía `use{Scope}Request` |
| `initData.source` | Módulo TS con constantes (`operations.*.initData` elige el símbolo) |

Ejemplo mínimo (2 operaciones PokeAPI en la demo):

```json
"openApi": {
  "files": {
    "pokemon": {
      "specSource": "./openapi/pokeapi.openapi.yaml",
      "scope": "pokemon",
      "basePath": "/api/v2",
      "include": { "operationIds": ["pokemon_list", "pokemon_retrieve"] },
      "zodOutput": "./src/api/pokemon.openapi.zod.ts",
      "typesOutput": "./src/api/pokemon.openapi.types.ts",
      "sdkOutput": "./src/api/pokemon.openapi.ts",
      "hooksOutput": "./src/api/pokemon.openapi.client.tsx"
    }
  }
}
```

**OpenAPI-first:** si no definís `react33Networking.apis.<scope>`, el generador crea el cliente desde `servers[0].url` + `basePath` (opcional `client` para headers/cache). `apis` manual gana si existe el mismo `scope`.

**Auth:** el generador **no** lee cookies ni tokens. Emite JSDoc `@openapi-security` por operación. Los tokens van en **`createApiRegistry(..., { loads })`** + **`AuthProfile`** (`@react33/react-persistence`):

```ts
import { createApiRegistry, type ApiClientConfigBody, type AuthProfile } from '@react33/react-networking';
import { createLoadRequestPropsFromAuthProfiles } from '@react33/react-persistence';
import { definitions } from './apis.generated';

const authMain: AuthProfile = {
  storage: 'cookie',
  key: 'authjs.session-token',
  headers: { Authorization: 'Bearer {token}' },
};

const authLoads = createLoadRequestPropsFromAuthProfiles({ main: authMain });

export const apisWithAuth = createApiRegistry(definitions satisfies Record<string, ApiClientConfigBody>, {
  load: async (shared) => shared,
  loads: {
    // pokemon: PokeAPI pública — sin load
    // admin: authLoads.admin,
  },
});
```

El SDK OpenAPI sigue usando `{scope}Request` de `apis.generated.ts`; para inyectar auth en runtime, exportá el registry con `loads` desde tu app (ver `apps/demo/src/api/auth.registry.example.ts`).

**Unions discriminadas:** schemas con `oneOf` + `discriminator` generan `z.discriminatedUnion('via', [...])` para alinear con formularios Zod.

**Validación runtime (`validate`):** en `openApi.files.*` podés activar Zod sobre params y response (`mode: log` | `strict`). Logs con `operationId`, schema e issues. Ver [README.en.md — Runtime validation](README.en.md#runtime-validation-validate-in-config).

**Rutas públicas (`security: []`):** el SDK generado emite **`skipLoad: true`** automáticamente. El `load` no corre para esas calls — así el endpoint de refresh no se re-llama a sí mismo. Ver `RequestProps.skipLoad` y `RetryContext.skipLoad` (los retry policies de session lo tratan como terminal: un 401 en pública nunca es token-expirado).

**Helpers:** `buildPathUrl`, `resolveOpenApiRequest`, `validateOpenApiParams`, `validateOpenApiResponse`, `OpenApiHookOverrides`.

`zod` es **peerDependency** opcional.

## Documentación completa (inglés)

Ver [README.en.md](README.en.md) — `useAsyncFetch`, `createApiRegistry`, auth, ejemplos detallados.
