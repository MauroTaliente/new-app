# @lib/networking

HTTP utilities for the browser and server, a **single in-flight request per `useAsyncFetch` instance**, and a small **event bus** (independent of fetch).

## Spirit

- **One call at a time** per hook instance is intentional: predictable ordering, clear “last trigger wins”, and no implicit parallel map of keys. Need parallel requests or multiple identities? Use **several hooks** or compose with **`joinResponses`**.
- **Retries** apply to **failures** only (thrown errors or retryable HTTP statuses: 5xx, 408, 429). `retries` is the count of *extra* attempts after the first try (`1 + retries` attempts total). Use **`retryDelayMs`** to pause between attempts (unstable APIs, rate limits).
- **Metadata** (`meta`) counts triggers, successes, blocks, errors, and prevented runs—useful for dashboards and guards. For UX, **`initialLoading`** is `loading && meta.success === 0` (skeleton on first load only); **`hasLoadedOnce`** is `meta.success > 0`.

## `useAsyncFetch`

Client hook (`'use client'`). Exposes `trigger`, `loading`, `data`, `error`, `status` (often reset to `0` after a cycle via internal `endController`), `meta`, **`initialLoading`**, **`hasLoadedOnce`**, and lifecycle callbacks.

### Contract

- A new `trigger` (or `auto` + `watch` change) bumps an internal counter; the async effect runs while `count > endCount` until the run finishes and `endCount` catches up—**one logical run at a time**, superseding the previous in-flight work via an `alive` flag.
- Duplicate `trigger` with the **same** params while `loading` is ignored (`isRepeated && loading`).
- After a response, **`status` may return to `0`** in the UI even when the request succeeded; rely on **`data`** and **`meta.success`** (and callbacks) for outcome, not only `status`.

### Options (high level)

| Option | Role |
|--------|------|
| `name` | Key for `updater` / `state.recordList[name]` meta |
| `action` | `async (params) => RequestReturn` |
| `setter` | Map response to `data` |
| `retries` | Extra attempts after a failed attempt (not after success) |
| `retryDelayMs` | Delay before each retry |
| `prevent` | Skip network; meta `prevented` |
| `auto` + `watch` | Re-run when deps change |

## Server: `request` / `createDataFlow`

`request` builds URL/body, parses JSON when appropriate, and returns `{ status, data, ... }`. `createDataFlow` merges shared props with per-call props and an optional `load` (e.g. auth headers).

## Declarative API registry (`createApiRegistry`)

Build many named HTTP clients from a list instead of repeating `createDataFlow` for each base URL.

- **`ApiClientConfig`**: `{ name, url, ...RequestInit }` — `name` must be a letter-first identifier (`admin`, `api_1`).
- **`ApiRegistry<T>`**: alias for a map of `Request` clients; default `T` is a wide `Record<string, Request<unknown, unknown>>`. With the map form of `createApiRegistry`, **`T` is inferred** as `ApiRegistryFromDefinitions<typeof definitions>` when `definitions` keeps literal keys (see below).
- **`createApiRegistry(entries | definitions, { load?, loads? })`**: pass an array of `{ name, url, ... }` **or** a map of `ApiClientConfigBody` (keys are API names). Map form returns **`ApiRegistry<ApiRegistryFromDefinitions<T>>`** so `apis.pokemon`, `apis.admin`, etc. are known to TypeScript without hand-written generics. Use **`satisfies Record<string, ApiClientConfigBody>`** on the object (as the generator does) so keys are not widened to `string`. Array form returns the wide `ApiRegistry` unless you use `as const` on names.
- **`load`**: shared `LoadRequestProps` for every client (e.g. one auth flow).
- **`loads`**: overrides per `name` when some APIs use different tokens or headers.

### `lib.config.json` + `lib-networking-generate`

For apps that already use `lib.config.json`, declare **`libNetworking.apis` as an object** (keys are the API names—no repeated `name` field):

```json
"libNetworking": {
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

Set **`libNetworking.output`** in `lib.config.json` (path relative to the config file) for the server-safe module, or pass **`--output`** on the CLI (CLI wins). Optional **`libNetworking.hooksOutput`** overrides the client hooks path; otherwise it is derived next to `apis.generated.ts` as **`apis.client.generated.tsx`**.

Then run the generator (after `@lib/networking` is built):

```bash
lib-networking-generate --config lib.config.json
```

It writes **two modules**:

1. **`apis.generated.ts`** — **`export const definitions`** (typed config), **`export const apis`**, **`export type ApiNames`** (`keyof typeof apis` for exhaustiveness), and one **`export const {name}Request = apis.{name}`** per API (server-safe `Request` clients).
2. **`apis.client.generated.tsx`** — `'use client'`, **`use{Name}Request`** for each API: `useAsyncFetch` + `apis.{name}` in the `action`.

**Why flat `pokemonRequest` + `usePokemonRequest` instead of `api.pokemon.request` / `api.pokemon.useRequest`?** Namespaced objects are fine in a single environment, but here the **server module must not import hooks**. One namespace split across two files (`api` vs `apiHooks`) adds indirection without much gain; flat exports keep imports obvious: server → `pokemonRequest` / `apis`, client → `usePokemonRequest`.

Use **`apis.generated.ts`** from server code, route handlers, and non-React callers; import **`use*Request`** only from client components (Next.js: avoid pulling hooks into server modules). The `satisfies` form preserves literal API keys on `definitions`. Re-run when `lib.config.json` changes.

Programmatic use: `import { generateApisModuleSource, generateApisHooksModuleSource, deriveHooksGeneratedPath, readLibNetworkingOutputPaths } from '@lib/networking/generate'`.

Pure helpers (no storage I/O):

- **`mergeRequestProps(base, patch)`** — merge `RequestProps`, including `Headers`.
- **`buildHeadersFromTokenTemplate(token, headers)`** — replace `{token}` in each header value (used with auth profiles below).

### `AuthProfile` (serializable contract)

Defined in this package for typing and docs; **reading** cookies/storage is implemented in `@lib/persistence` (this package does not depend on persistence).

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
} from '@lib/networking';
import {
  createLoadRequestPropsFromAuthProfile,
  createLoadRequestPropsFromAuthProfiles,
} from '@lib/persistence';

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

**Never** commit API keys or tokens inside `lib.config.json` (or any static config that ships with the repo). Use **environment variables** and wire the secret in **TypeScript** via `LoadRequestProps`, so it is resolved at build/runtime from the environment, not from generated config.

**Recommended flow**

1. Define the secret in `.env`, CI, or your host (e.g. `VITE_*` / `NEXT_PUBLIC_*` only if you accept the value in the client bundle; for truly private keys, call the API from the server or a proxy route).
2. In the module where you call `createApiRegistry` or `createDataFlow`, pass a `load` (shared) or `loads[apiName]` (per client) that reads the env and merges headers:

   ```ts
   import type { LoadRequestProps } from '@lib/networking';
   import { mergeRequestProps } from '@lib/networking';

   const apiKey = import.meta.env.VITE_MY_API_KEY; // or process.env.MY_API_KEY

   const loadWithApiKey: LoadRequestProps = async (shared) =>
     mergeRequestProps(shared, {
       headers: { 'X-Api-Key': apiKey ?? '' },
     });
   ```

3. If **codegen or build steps** generate hooks from `lib.config.json`, treat the JSON as **non-secret metadata only** (API name, base URL, *name* of the header such as `"X-Api-Key"`). The **value** always comes from env in hand-written or templated TS that references `import.meta.env` / `process.env`—never inline the key into generated files from JSON.
4. Tokens **stored** in cookies or `localStorage` / `sessionStorage` are covered by **`AuthProfile`** and `@lib/persistence`’s `createLoadRequestPropsFromAuthProfile`. Static API keys from env are not: use a custom `load` as above.

**Summary:** required API key = **env + `LoadRequestProps`** (`mergeRequestProps`). Config files can describe *that* an API needs a key; they must not contain the key itself.

## Helpers

- **`buildRequestUrl` / `buildRequestBody`** – query string for GET with object body, JSON body for mutations.
- **`joinResponses`** – merge several `{ status, loading, data, errors }` into one aggregate (parent composition).
- **`shouldRetryAfterHttpFailure`** – default retry policy (5xx, 408, 429).
- **`sleepMs`** – delay helper used between retries.

## Event bus

`createEventBus` is unchanged: typed `on` / `off` / `emit` / `once` with an optional queued replay for early emits. It does not depend on React or fetch.

## Comparison (mental model)

Libraries like TanStack Query focus on **cache + query keys + global deduping**. This package favors **local, explicit control** and a **serial** request model per hook—complementary, not a drop-in replacement.
