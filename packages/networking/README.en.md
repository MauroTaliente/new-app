# @react33/react-networking

HTTP utilities for the browser and server, a **single in-flight request per `useAsyncFetch` instance**, and a small **event bus** (independent of fetch).

## Spirit

- **One call at a time** per hook instance is intentional: predictable ordering, clear “last trigger wins”, and no implicit parallel map of keys. Need parallel requests or multiple identities? Use **several hooks** or compose with **`joinResponses`**.
- **Retries** apply to **failures** only (thrown errors or retryable HTTP statuses: 5xx, 408, 429). `retries` is the count of *extra* attempts after the first try (`1 + retries` attempts total). Use **`retryDelayMs`** to pause between attempts (unstable APIs, rate limits).
- **Metadata** (`meta`) counts triggers, successes, blocks, errors, and prevented runs—useful for dashboards and guards. For UX, **`initialLoading`** is `loading && meta.success === 0` (skeleton on first load only); **`hasLoadedOnce`** is `meta.success > 0`.

## `useAsyncFetch`

Client hook (`'use client'`). Exposes `trigger`, `loading`, `data`, `error`, `status` (often reset to `0` after a cycle), `meta`, **`initialLoading`**, **`hasLoadedOnce`**, and lifecycle callbacks.

### Contract (v2 — explicit fetch)

| Mechanism | Role |
|-----------|------|
| **`trigger(params?)`** | **Only** way to start a network call (GET, POST, …). Sets `memo.params` when `params` is passed; reuses the last params when omitted. |
| **`fetchOnMount`** | Optional **one** fetch on first mount using current `memo.params` (usually `undefined` unless you already called `trigger`). |

There is **no** `params` option on the hook settings, **no** second `watch` argument, and **no** hidden refetch-on-deps inside the hook. Reactive GETs: **`useEffect` + `trigger(params)`** in the component when URL or state changes.

- One in-flight request per instance (`count` / `alive`).
- Duplicate `trigger` with the **same** params while `loading` is ignored.
- Rely on **`data`** and **`meta.success`**, not only `status` (status may return to `0` after success).

### Examples

**GET on mount (static params):**

```tsx
const { trigger: loadList } = usePokemonList({ fetchOnMount: false });
useEffect(() => {
  loadList({ query: { limit: 10, offset: 0 } });
}, [loadList]);
```

Or **`fetchOnMount: true`** when params on first fetch can be `undefined`.

**Reactive GET (URL / filters):**

```tsx
const { trigger: fetchTrips } = useListTrips({ initData: mock, fetchOnMount: false });
useEffect(() => {
  fetchTrips({ query: { page, q: search } });
}, [page, search, fetchTrips]);
```

**Mutation / user action:**

```tsx
signInReq.trigger({ body: values }, ({ data, status }) => { … });
```

**Detail on user action (no fetch on deps):**

```tsx
const { trigger: loadDetail } = usePokemonRetrieve();
const onSelect = (name: string) => loadDetail({ path: { id: name } });
```

**Legacy flat params** (non-OpenAPI hooks): `trigger({ day })` — avoid embedding query strings in `url`; keep `url` as the path template.

### Other options

| Option | Role |
|--------|------|
| `name` | Meta key / cache namespace |
| `action` | `async (params?) => RequestReturn` |
| `setter` | Map response to `data` |
| `retries` / `retryDelayMs` | Retry failures only |
| `prevent` | Skip network |
| `initData` | Initial `data` |
| `requestCache` / `cacheKey` / `cacheTtlMs` | Dedupe + optional TTL |

Caching wraps the **`action`** (your `apis.*` call), not raw `fetch`.

## Server: `request` / `createDataFlow`

`request` builds URL/body, parses JSON when appropriate, and returns `{ status, data, ... }`. `createDataFlow` merges shared props with per-call props and an optional `load` (e.g. auth headers).

## Declarative API registry (`createApiRegistry`)

Declare **`react33Networking.apis`** in `react33.config.json` (name → `{ url, headers?, session?, … }`). Set **`registryOutput`** to the path of **`apis.generated.ts`**. The default client hooks module is **`apis.client.generated.tsx`** (override with **`hooksOutput`**).

Run **`react-networking-generate --config react33.config.json`** or **`react-generate`**. **`--output`** overrides **`registryOutput`** from JSON.

### API surface

- **`createApiRegistry(entries | definitions, { load?, loads?, defaults?, defaultsByApi? })`** — array of `{ name, url, ... }` **or** a map keyed by API name (use **`satisfies Record<string, ApiClientConfigBody>`** so keys stay literal and `apis.pokemon` is known to TypeScript without hand-written generics).
- **`load`** — shared `LoadRequestProps` for every client (one auth flow).
- **`loads`** — per-`name` override when some APIs use different tokens/headers. Modern wiring: prefer **`apis.<name>.session`** in `react33.config.json` (FK to a `react33Session.sessions.*` entry) so the codegen attaches the right `load` automatically — `loads` stays as the escape hatch.
- **`defaults`** — registry-wide `RequestProps` defaults (`retries`, `onRetry`, `retryDelayMs`, `timeoutMs`).
- **`defaultsByApi`** — per-`name` defaults. Merge order (lowest→highest): `defaults` < `defaultsByApi[name]` < per-API definition < per-call props.
- **`ApiRuntime`** — the seam type a `runtimeModule` exports for the codegen: `{ defineDefinitions?, load?, loads?, defaults?, defaultsByApi? }`. `@react33/react-session` emits a module of this shape (see that package's README).

The generator writes **two modules**:

1. **`apis.generated.ts`** — `export const definitions`, `export const apis`, `export type ApiNames = keyof typeof apis`, and one **`export const {name}Request = apis.{name}`** per API. **Server-safe** (no React).
2. **`apis.client.generated.tsx`** — `'use client'`, **`use{Name}Request`** for each API: `useAsyncFetch` + `apis.{name}` as the `action`.

Why flat `pokemonRequest` + `usePokemonRequest` instead of `api.pokemon.request` / `api.pokemon.useRequest`? Server modules **must not** import hooks. A single namespace split across two files adds indirection; flat exports keep imports obvious: server → `pokemonRequest`, client → `usePokemonRequest`.

Programmatic use: `import { generateApisModuleSource, generateApisHooksModuleSource, deriveHooksGeneratedPath, readReact33NetworkingOutputPaths } from '@react33/react-networking/generate'`.

## OpenAPI 3.1 codegen

Add **`react33Networking.openApi.files`** (see `@react33/react-config` schema). Each entry points to a **≥ 3.1** YAML/JSON spec, an existing **`scope`** in `apis`, and output paths:

| Output | Content |
|--------|---------|
| `*.openapi.zod.ts` | Zod schemas (runtime validation; forms) |
| `*.openapi.types.ts` | `z.infer` + `{Operation}HookOverrides` |
| `*.openapi.ts` | Server-safe SDK (`listTrips`, …) → `{scope}Request` |
| `*.openapi.client.tsx` | `useListTrips`, … via `use{Scope}Request` |
| `initData.source` | TS module with constants (`operations.*.initData` picks the symbol) |

Minimal example (2 PokeAPI operations in the demo):

```json
"openApi": {
  "files": {
    "pokemon": {
      "specSource": "./openapi/pokeapi.openapi.yaml",
      "scope": "pokemon",
      "basePath": "/api/v2",
      "output": {
        "zod": "./src/api/pokemon.openapi.zod.ts",
        "types": "./src/api/pokemon.openapi.types.ts",
        "sdk": "./src/api/pokemon.openapi.ts",
        "hooks": "./src/api/pokemon.openapi.client.generated.ts"
      },
      "operations": {
        "pokemonList": { "fetchOnMount": true }
      }
    }
  }
}
```

Generated hooks: `usePokemonList(options?)` — no `watch` second argument.

The generated SDK marks public operations (`security: []`) with **`skipLoad: true`** so the auth-refresh endpoint cannot re-enter its own refresh. See `RequestProps.skipLoad` and `RetryContext.skipLoad`.

### Runtime validation (`validate` in config)

In `openApi.files.*`:

```json
"validate": { "params": true, "response": true, "mode": "log" }
```

- **`params`** — Zod-check before `resolveOpenApiRequest` / network.
- **`response`** — Zod-check on `response.data` after fetch.
- **`mode`** — `log` (warn, keep going) or `strict` (throw `OpenApiValidationError`).

Per call: `pokemon_list(params, { validate: false })` or `validate: { response: false }`.

Defaults are baked per operation as `{operationId}ValidateDefaults` in the generated SDK. Merge order: `defaults.validate` → `openApi.files.*.validate` → `operations.<operationId>.validate` (later wins).

```json
"validate": { "params": true, "response": true, "mode": "log" },
"operations": {
  "pokemon_list": { "validate": true },
  "pokemon_retrieve": { "validate": { "params": true, "response": false } }
}
```

## Auth: `AuthProfile` and secrets

### `AuthProfile` (serializable contract)

Typed here, **read** in `@react33/react-persistence` (this package has no persistence dependency).

- **`storage`** — `'cookie' | 'localStorage' | 'sessionStorage'`
- **`key`** — cookie name or storage key
- **`headers`** — header map; each value may contain the literal `{token}`

For most apps, prefer **`@react33/react-session`** (bearer / bearer-static / external strategies) over hand-rolling profiles — it covers the same surface plus refresh, cross-tab serialisation, and 401 retry.

### API keys (and other secrets): never in JSON config

**Do not** commit API keys or tokens to `react33.config.json` (or any static config that ships with the repo). Use **environment variables** and wire the secret in **TypeScript** via `LoadRequestProps`.

```ts
import type { LoadRequestProps } from '@react33/react-networking';
import { mergeRequestProps } from '@react33/react-networking';

const apiKey = import.meta.env.VITE_MY_API_KEY; // or process.env.MY_API_KEY

const loadWithApiKey: LoadRequestProps = async (shared) =>
  mergeRequestProps(shared, { headers: { 'X-Api-Key': apiKey ?? '' } });
```

Rules:

1. `.env` / CI / host env. Public client builds: `VITE_*` / `NEXT_PUBLIC_*`. Truly private keys: call the API from the server or a proxy route.
2. If codegen reads `react33.config.json`, treat the JSON as **non-secret metadata only** (API name, base URL, header *name* like `"X-Api-Key"`). The **value** comes from env in hand-written TS — never inline keys into generated files.
3. Tokens **stored** in cookies/localStorage/sessionStorage → `AuthProfile` + `createLoadRequestPropsFromAuthProfile` from `@react33/react-persistence`. Static keys from env → custom `load` as above.

## Helpers

- **`buildRequestUrl` / `buildRequestBody`** — query string for GET with object body, JSON body for mutations.
- **`joinResponses`** — merge several `{ status, loading, data, errors }` into one aggregate (parent composition).
- **`shouldRetryAfterHttpFailure`** — default retry policy (5xx, 408, 429).
- **`sleepMs`** — delay helper used between retries.
- **`mergeRequestProps(base, patch)`** — merge `RequestProps`, including `Headers`.

## Event bus

Independent from fetch. **`createEventBus`**, **`useEventBus`**, typed channels. See source under `src/event-bus/`.

## Package layout

| Path | Role |
|------|------|
| `src/fetch/fetch.client.tsx` | `useAsyncFetch` |
| `src/fetch/fetch.server.ts` | `request`, `createDataFlow` |
| `src/openapi/` | OpenAPI parse + codegen |
| `src/generate-react33-apis.ts` | Registry codegen CLI |

## Peer dependencies

- **`react` ≥ 18** (client hooks)
- **`zod` ^4** (optional; OpenAPI validation)
