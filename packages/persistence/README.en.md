# @react33/react-persistence

Browser storage (localStorage, sessionStorage, cookies) and optional Next.js cookie-store helpers.

## `readClientEnv` / `resolvePersistenceMode`

Used by `@react33/react-i18n` and `@react33/react-theme` generated runtimes to optionally override `persistenceMode` via env.

- **`readClientEnv()`** — merges `process.env` (Node/Next) and `import.meta.env` (Vite).
- **`resolvePersistenceMode({ persistenceMode, persistenceEnvKey, env })`** — env wins when the key is set and readable.

**Client exposure is your bundler’s job:** Vite needs `envPrefix: ['REACT33_']`; Next needs `NEXT_PUBLIC_*` names. See **[Persistence env vars — client exposure](../../docs/persistence-env-client.en.md)**.

## Versioned storage (`createVersionedStorageApi`)

For keys whose JSON shape evolves over time, persist **`{ _v: number, data: T }`** (optional **`savedAt`** when using TTL) and register **one-step migrators** `migrations[k]` from version `k` to `k + 1`. Values **without** `_v` are read as **version 0** (the whole parsed value is treated as `data`).

- **`getLocal` / `setLocal` / `putLocal`** match the same ergonomics as `createStorageApi`, but `data` is the domain payload (not the envelope).
- After a successful migration, the latest envelope is **written back** (write-through).
- If a migration throws, or stored `_v` is **greater** than `currentVersion`, reads fall back to **`initData`** (safe default).
- Optional **`ttlMs`:** when set to a positive number, writes include `savedAt` (epoch ms). Reads **remove** the key and return `initData` when the entry is older than `ttlMs`. Envelopes **without** `savedAt` are **not** expired.

## Cross-tab updates

`localStorage` is shared across tabs on the same origin. The browser **`storage`** event notifies **other** tabs when a key changes (not the tab that called `setItem`). Use **`subscribeStorageKey(storage, key, handler)`** to run code when another tab updates a key (e.g. refresh UI or invalidate in-memory caches). Same-tab updates still require your own state or a `BroadcastChannel` if you need symmetry.

## HTTP auth loaders (`createLoadRequestPropsFromAuthProfile`)

`@react33/react-networking` owns `createDataFlow` and **`AuthProfile`** types. This package adds **reading** a raw token from a cookie or storage and merging headers via `mergeRequestProps` / `buildHeadersFromTokenTemplate` from `@react33/react-networking`.

- **`createLoadRequestPropsFromAuthProfile(profile)`** — returns a `LoadRequestProps` for one API.
- **`createLoadRequestPropsFromAuthProfiles(record)`** — map of named loaders for `createApiRegistry(..., { loads })`.

Cookies are read with **`parseDocumentCookie`** so opaque JWT strings work (not only JSON values).

Re-exported type: **`AuthProfile`** (from `@react33/react-networking`).
