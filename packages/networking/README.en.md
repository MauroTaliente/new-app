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
| **`trigger(params?)`** | **Only** way to start a network call. Sets `memo.params` when `params` is passed; reuses the last params when omitted. |
| **`fetchOnMount`** | Optional **one** fetch on first mount (typical GET lists). Uses `memo.params` after `mapWatchToParams` runs. |
| **`watch` (2nd arg)** | Dependency list. **Does not** fetch when it changes. |
| **`mapWatchToParams`** | `(watch) => Params` — syncs `memo.params` when `watch` changes (**no network**). |
| **`resetDataOnWatchChange`** | After first mount, resets `data` to `initData` when `watch` changes (**no network**). |

There is **no** `params` option on the hook settings and **no** refetch-on-deps. Dynamic query/path values belong in `trigger({ … })` or in `mapWatchToParams` + `trigger`.

- One in-flight request per instance (`count` / `alive`).
- Duplicate `trigger` with the **same** params while `loading` is ignored.
- Rely on **`data`** and **`meta.success`**, not only `status` (status may return to `0` after success).

### Examples

**GET on mount (list):**

```tsx
const { data, trigger, initialLoading } = usePokemonList(
  {
    fetchOnMount: true,
    mapWatchToParams: () => ({ query: { limit: 10, offset: 0 } }),
  },
  [],
);
```

**Imperative fetch when context changes (refetch):**

```tsx
useEffect(() => {
  trigger({ query: { day } });
}, [day]);
```

**Detail on user action (no fetch on deps):**

```tsx
const { trigger: loadDetail } = usePokemonRetrieve({}, []);
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
| `initData` | Initial `data` / reset target |
| `requestCache` / `cacheKey` / `cacheTtlMs` | Dedupe + optional TTL |

Caching wraps the **`action`** (your `apis.*` call), not raw `fetch`.

## Server: `request` / `createDataFlow`

`request` builds URL/body, parses JSON when appropriate, and returns `{ status, data, ... }`. `createDataFlow` merges shared props with per-call props and an optional `load` (e.g. auth headers).

## Declarative API registry (`createApiRegistry`)

Build many named HTTP clients from a list instead of repeating `createDataFlow` for each base URL.

- **`ApiClientConfig`**: `{ name, url, ...RequestInit }` — `name` must be a letter-first identifier (`admin`, `api_1`).
- **`ApiRegistry<T>`**: alias for a map of `Request` clients; default `T` is a wide `Record<string, Request<unknown, unknown>>`. With the map form of `createApiRegistry`, **`T` is inferred** as `ApiRegistryFromDefinitions<typeof definitions>` when `definitions` keeps literal keys (see below).
- **`createApiRegistry(entries | definitions, { load?, loads?, defaults?, defaultsByApi? })`**: pass an array of `{ name, url, ... }` **or** a map of `ApiClientConfigBody` (keys are API names). Map form returns **`ApiRegistry<ApiRegistryFromDefinitions<T>>`** so `apis.pokemon`, `apis.admin`, etc. are known to TypeScript without hand-written generics. Use **`satisfies Record<string, ApiClientConfigBody>`** on the object (as the generator does) so keys are not widened to `string`. Array form returns the wide `ApiRegistry` unless you use `as const` on names.
- **`load`**: shared `LoadRequestProps` for every client (e.g. one auth flow).
- **`loads`**: overrides per `name` when some APIs use different tokens or headers.
- **`defaults`**: registry-wide `RequestProps` defaults (`retries`, `onRetry`, `retryDelayMs`, `timeoutMs`) applied to every client.
- **`defaultsByApi`**: per-`name` defaults — the per-API counterpart of `defaults`. Use when the policy is API-specific, e.g. a session-specific retry/`onRetry` so a 401 from one API refreshes only that API's session. Merge order (lowest→highest): `defaults` < `defaultsByApi[name]` < per-API definition < per-call props.
- **`ApiRuntime`**: the seam type a `runtimeModule` exports for the codegen — `{ defineDefinitions?, load?, loads?, defaults?, defaultsByApi? }`. The `@react33/react-session` codegen generates a module of this shape (see that package's README).

### `react33.config.json` + `react-networking-generate`

For apps that already use `react33.config.json`, declare **`react33Networking.apis` as an object** (keys are the API names—no repeated `name` field):

```json
"react33Networking": {
  "apis": {
    "pokemon": {
      "url": "https://pokeapi.co/api/v2",
      "headers": { "Accept": "application/json" }
    },
    "admin": {
      "url": "https://api.example.com",
      "cache": "no-store"
    }
  }
}
```

Set **`react33Networking.registryOutput`** in `react33.config.json` (path relative to the config file) for the server-safe module, or pass **`--output`** on the CLI (CLI wins). Optional **`react33Networking.hooksOutput`** overrides the client hooks path; otherwise it is derived next to `apis.generated.ts` as **`apis.client.generated.tsx`**.

Then run the generator (after `@react33/react-networking` is built):

```bash
react-networking-generate --config react33.config.json
```

It writes **two modules**:

1. **`apis.generated.ts`** — **`export const definitions`** (typed config), **`export const apis`**, **`export type ApiNames`** (`keyof typeof apis` for exhaustiveness), and one **`export const {name}Request = apis.{name}`** per API (server-safe `Request` clients).
2. **`apis.client.generated.tsx`** — `'use client'`, **`use{Name}Request`** for each API: `useAsyncFetch` + `apis.{name}` in the `action`.

**Why flat `pokemonRequest` + `usePokemonRequest` instead of `api.pokemon.request` / `api.pokemon.useRequest`?** Namespaced objects are fine in a single environment, but here the **server module must not import hooks**. One namespace split across two files (`api` vs `apiHooks`) adds indirection without much gain; flat exports keep imports obvious: server → `pokemonRequest` / `apis`, client → `usePokemonRequest`.

Use **`apis.generated.ts`** from server code, route handlers, and non-React callers; import **`use*Request`** only from client components (Next.js: avoid pulling hooks into server modules). The `satisfies` form preserves literal API keys on `definitions`. Re-run when `react33.config.json` changes.

Programmatic use: `import { generateApisModuleSource, generateApisHooksModuleSource, deriveHooksGeneratedPath, readReact33NetworkingOutputPaths } from '@react33/react-networking/generate'`.

### OpenAPI 3.1 codegen

Add `react33Networking.openApi.files` in `react33.config.json` (see `@react33/react-config` schema). Each entry points at an OpenAPI **3.1+** YAML/JSON file, a `scope` key from `react33Networking.apis`, and output paths for:

- `*.openapi.zod.ts` — Zod schemas (`z` is an optional peer dependency)
- `*.openapi.types.ts` — `z.infer` types + `{Operation}HookOverrides`
- `*.openapi.ts` — server-safe SDK (`listTrips`, …) calling `{scope}Request`
- `*.openapi.client.tsx` — `useListTrips` hooks via `use{Scope}Request`
- optional `initData.source` — constants module wired from `operations.<id>.initData`

`react-networking-generate` emits the above after `apis.generated.ts`. **Auth stays in `createApiRegistry` `loads` / `AuthProfile`** — generated SDK functions only include `@openapi-security` JSDoc hints from the spec, not tokens.

Helpers: `buildPathUrl`, `resolveOpenApiRequest`, `validateOpenApiParams`, `validateOpenApiResponse`, `OpenApiHookOverrides`.

### Runtime validation (`validate` in config)

In `openApi.files.*`:

```json
"validate": { "params": true, "response": true, "mode": "log" }
```

- **`params`**: Zod-check before `resolveOpenApiRequest` / network.
- **`response`**: Zod-check on `response.data` after fetch.
- **`mode`**: `log` (console warn, keep going) or `strict` (throw `OpenApiValidationError`).

Per call: `pokemon_list(params, { validate: false })` or `validate: { response: false }`.

Defaults are baked per operation as `{operationId}ValidateDefaults` in the generated SDK.

Merge order: `defaults.validate` → `openApi.files.*.validate` → `operations.<operationId>.validate` (later wins).

```json
"validate": { "params": true, "response": true, "mode": "log" },
"operations": {
  "pokemon_list": { "validate": true },
  "pokemon_retrieve": { "validate": { "params": true, "response": false } }
}
```

Pure helpers (no storage I/O):

- **`mergeRequestProps(base, patch)`** — merge `RequestProps`, including `Headers`.

### `AuthProfile` (serializable contract)

Defined in this package for typing and docs; **reading** cookies/storage is implemented in `@react33/react-persistence` (this package does not depend on persistence).

- **`storage`**: `'cookie' | 'localStorage' | 'sessionStorage'`
- **`key`**: cookie name or storage key
- **`headers`**: map of header values, each may contain the literal `{token}`

### Example: ten APIs, three with their own tokens

Define **reusable profiles** in TypeScript (env URLs, not JSON functions):

```ts
import {
  createApiRegistry,
  type ApiClientConfigBody,
  type AuthProfile,
} from '@react33/react-networking';
import {
  createLoadRequestPropsFromAuthProfile,
  createLoadRequestPropsFromAuthProfiles,
} from '@react33/react-persistence';

const authMain: AuthProfile = {
  storage: 'cookie',
  key: 'authjs.session-token',
  headers: { Authorization: 'Bearer {token}' },
};

const authServiceA: AuthProfile = {
  storage: 'localStorage',
  key: 'token_service_a',
  headers: { Authorization: 'Bearer {token}' },
};

const authServiceB: AuthProfile = {
  storage: 'sessionStorage',
  key: 'token_service_b',
  headers: { 'X-Api-Key': '{token}' },
};

const profiles = createLoadRequestPropsFromAuthProfiles({
  main: authMain,
  serviceA: authServiceA,
  serviceB: authServiceB,
});

const definitions = {
  admin: { url: process.env.NEXT_PUBLIC_ADMIN_URL!, headers: { Accept: 'application/json' }, cache: 'no-store' },
  account: { url: process.env.NEXT_PUBLIC_ACCOUNT_URL!, headers: { Accept: 'application/json' }, cache: 'no-store' },
  flight: { url: process.env.NEXT_PUBLIC_FLIGHT_URL!, headers: { Accept: 'application/json' }, cache: 'no-store' },
  // ... seven more public or unauthenticated APIs: omit per-api load, use empty global load
} satisfies Record<string, ApiClientConfigBody>;

const apis = createApiRegistry(definitions, {
  load: async (s) => s,
  loads: {
    admin: profiles.main,
    account: profiles.main,
    someOther: profiles.serviceA,
    // map only the three that need tokens; others fall back to `load`
  },
});

// apis.admin({ url: '/v1/stations', method: 'GET' })
```

For **HMAC, two custom headers, or non-stored secrets**, pass a custom `LoadRequestProps` in `loads[apiName]` from app code instead of `AuthProfile`.

### API keys (and other secrets): do not put them in JSON config

**Never** commit API keys or tokens inside `react33.config.json` (or any static config that ships with the repo). Use **environment variables** and wire the secret in **TypeScript** via `LoadRequestProps`, so it is resolved at build/runtime from the environment, not from generated config.

**Recommended flow**

1. Define the secret in `.env`, CI, or your host (e.g. `VITE_*` / `NEXT_PUBLIC_*` only if you accept the value in the client bundle; for truly private keys, call the API from the server or a proxy route).
2. In the module where you call `createApiRegistry` or `createDataFlow`, pass a `load` (shared) or `loads[apiName]` (per client) that reads the env and merges headers:

   ```ts
   import type { LoadRequestProps } from '@react33/react-networking';
   import { mergeRequestProps } from '@react33/react-networking';

   const apiKey = import.meta.env.VITE_MY_API_KEY; // or process.env.MY_API_KEY

   const loadWithApiKey: LoadRequestProps = async (shared) =>
     mergeRequestProps(shared, {
       headers: { 'X-Api-Key': apiKey ?? '' },
     });
   ```

3. If **codegen or build steps** generate hooks from `react33.config.json`, treat the JSON as **non-secret metadata only** (API name, base URL, *name* of the header such as `"X-Api-Key"`). The **value** always comes from env in hand-written or templated TS that references `import.meta.env` / `process.env`—never inline the key into generated files from JSON.
4. Tokens **stored** in cookies or `localStorage` / `sessionStorage` are covered by **`AuthProfile`** and `@react33/react-persistence`’s `createLoadRequestPropsFromAuthProfile`. Static API keys from env are not: use a custom `load` as above.

**Summary:** required API key = **env + `LoadRequestProps`** (`mergeRequestProps`). Config files can describe *that* an API needs a key; they must not contain the key itself.

## Helpers

- **`buildRequestUrl` / `buildRequestBody`** – query string for GET with object body, JSON body for mutations.
- **`joinResponses`** – merge several `{ status, loading, data, errors }` into one aggregate (parent composition).
- **`shouldRetryAfterHttpFailure`** – default retry policy (5xx, 408, 429).
- **`sleepMs`** – delay helper used between retries.

## Event bus

`createEventBus` is unchanged: typed `on` / `off` / `emit` / `once` with an optional queued replay for early emits. It does not depend on React or fetch.

## Comparison (mental model)

This package favors **local, explicit control** and a **serial** request model per hook. Optional **`RequestCache`** adds in-memory dedup/TTL when you wire it—without a built-in global invalidation graph.
