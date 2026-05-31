# Changelog

All notable changes to this monorepo are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for **applications** (`apps/*`). **Workspace libraries** (`@react33/react-*`) are currently
**0.0.x** and bumped together when breaking or meaningful changes land; see
[Versioning policy](#versioning-policy) below.

## [Unreleased]

Publish order: helpers → hooks → networking → persistence → session →
config / i18n / theme / react-generate. The **networking** bump carries a
breaking change (the `watch` API is removed); persistence, session and the demo
depend on it.

### @react33/react-helpers `0.0.6`

#### Added

- **`omitNullOrEmpty(value)` / `omitNullOrEmptyDeep(value)`** — prune
  `null` / `undefined` / `''` / `[]` / `{}` entries from objects (and, for the
  deep form, recursively); arrays filter their entries. For sanitising request
  payloads and query maps before they hit the wire.
- **`clampInt(value, min = 1, max?)`** — `Math.floor` + clamp to `[min, max]`
  (NaN passes through). Pagination-oriented; shared by the query-int resolvers.
- **`@react33/react-helpers/router` subpath** — pure, framework-free
  query-string resolvers: `safeInt` / `queryInt` (+ `QueryParamRaw`) and
  `safeString` / `queryString` (+ `RouteQueryRaw`). Curried forms (`queryInt(1)`)
  drop straight into `getGroup` resolver maps. Pairs with
  `@react33/react-hooks/router` so loaders, tests and hooks resolve identically.

### @react33/react-hooks `0.0.5`

#### Added

- **Typed `getGroup` resolvers** — `getGroup({ page: queryInt(1) })` now infers
  the result shape (`RouteQueryResolver`, `RouteQueryGroupDefaults`,
  `RouteQueryGroupResult`, `InferRouteQueryValue`), accepting resolver functions
  alongside string / number / boolean defaults.

#### Changed

- **Default route-query update mode is now `'replace'`** (was `'silent'`),
  exported as `DEFAULT_ROUTE_QUERY_MODE`, so `useSearchParams` in react-router /
  Next re-renders on `add()` / `applyUrl()`. Both adapters compare against the
  router-derived `route` instead of `window.location`, fixing a stale address
  bar in tests and embedded hosts.

### @react33/react-networking `0.0.5`

#### Added

- **`RequestProps.skipLoad` (and `RetryContext.skipLoad`)** — when set,
  `createDataFlow` bypasses `load(shared)` entirely (no auth augmentation, no
  proactive refresh). Lets public routes and the refresh endpoint itself avoid a
  re-entrant load; the openapi codegen stamps `skipLoad: true` on operations the
  spec marks public (`security: []`). The flag is stripped from `RequestInit`.

#### Changed

- Swapped the `use-memo-one` dependency for React's own `useMemo` / `useCallback`
  — one fewer transitive dep, and no double-React hazard when a consumer links
  the package locally.

#### Breaking

- **Removed the `watch` API from `useAsyncFetch`** — the second `watch`
  argument, `mapWatchToParams`, and `resetDataOnWatchChange` are gone, and both
  codegen templates no longer emit them. Reactive GETs use an explicit
  `useEffect` + `trigger`/`refetch`; `fetchOnMount` remains for the simple
  initial-GET case. Regenerate API hooks and migrate any `watch` callers.

### @react33/react-persistence `0.0.5`

#### Added

- **`createPersistedSignal({ key, storage?, initData })`** — a reactive,
  storage-backed signal for state whose **source of truth lives outside React**
  (so non-React code can read it synchronously) yet still drives React
  subscribers. Returns `{ get, set, subscribe, use }`: `get()` is a plain sync
  read (e.g. for a networking `LoadRequestProps`); `use()` is a
  `useSyncExternalStore` binding with a snapshot cache for stable references.
  Unlike calling the loose `getLocalStorage` / `setLocalStorage` /
  `subscribeStorageKey` directly, the factory owns `set` + a **same-tab**
  in-process emitter together — `subscribeStorageKey` only fires cross-tab, so a
  loose `setLocalStorage` never notifies its own tab. Counterpart to
  `newContext` (context **owns** the data) for the "data lives in storage,
  React **subscribes**" case. See the react33-architecture skill, Principle 12
  (wrapper that *hides* vs factory that *binds*).

#### Changed

- The storage hooks (`useGet/Set/Put` `Local` / `Session` / `Cookie`) drop the
  now-removed `watch` passthrough to match `@react33/react-networking@0.0.5`.

### @react33/react-session `0.0.4`

#### Fixed

- **`createBearerSessionRetry.onRetry` honours `skipLoad`** — a load-bypassed
  request (notably the refresh endpoint) no longer triggers
  `ensureFreshSession()` on a 401, avoiding a re-entrant refresh; such a 401 is
  never token-expiry.

### @react33/react-form `0.2.5`

#### Added

- **`api.connectRange(startKey, endKey)` → `FromInputRangeApi`** — a `[start,
  end]` tuple binding that commits each end to its own field (merging
  error / touched / focus), for range-capable inputs such as `InputDatePicker`
  with `selectionMode="range"` (`{...api.connectRange(a, b)}`).

### @react33/react-generate `0.0.7`

#### Fixed

- **Codegen emits `skipLoad: true` on public routes again.** `0.0.6` was already
  published (from the prior release, when the workspace had
  `@react33/react-networking@0.0.4`) and is immutable, so its rewritten pin
  froze at `react-networking@0.0.4` — which predates `skipLoad`. Installing
  `react-generate@0.0.6` therefore pulled the pre-`skipLoad` generator and
  stopped stamping `skipLoad` on `security: []` operations (including the
  refresh-session endpoint), re-introducing the re-entrant-refresh hazard.
  `0.0.7` re-publishes from a workspace pinning `react-networking@0.0.5`, so the
  generator emits `skipLoad` again. (Same class of bug as the `0.0.4 →
  react-networking@0.0.2` note below — **never reuse a published
  `react-generate` version number; always bump past `npm view` latest**.)

### @react33/react-config `0.0.4` · @react33/react-i18n `0.0.7` · @react33/react-theme `0.0.4`

#### Changed

- Coordinated-release version bumps (no functional change) to keep the workspace
  libraries aligned for this publish round.

## [0.0.5] — 2026-05-18

Publish **`@react33/react-i18n@0.0.5`** before **`@react33/react-generate@0.0.5`** so apps on `pnpm codegen` get `useTf` ICU formatting from the published runtime.

### @react33/react-i18n

#### Changed

- **`useTf`** applies ICU MessageFormat via `formatMessage` using locale from `LocaleProvider` (previously returned raw dictionary strings and ignored `values`).

### @react33/react-generate

#### Changed

- **`0.0.5`** depends on **`@react33/react-i18n@0.0.5`** (workspace publish rewrite).

## [0.0.4] — 2026-05-18

Publish **`@react33/react-i18n@0.0.4`** before **`@react33/react-generate@0.0.4`** so `pnpm codegen` / `react-generate` resolves the updated `react-i18n-generate` bin (not the 0.0.3 generator).

### @react33/react-i18n

#### Fixed

- Generated runtime persistence API aligned with theme: **`getInitialLocale`**, **`persistLocale`** (replacing `resolveAppLocale`, `persistLocaleChoice`).

#### Breaking (codegen)

- Regenerate `i18n.runtime.generated.tsx` and update imports if you used the previous export names.

### @react33/react-generate

#### Changed

- **`0.0.4`** depends on **`@react33/react-i18n@0.0.4`** (workspace publish rewrite). Apps that only bump `react-generate` without reinstalling get the new i18n codegen transitively when using `react-generate` as the CLI entry.

## [0.0.6] — 2026-05-20

Publish order: helpers → persistence → networking → session → config → i18n.
All bumps are additive (no breaking changes); upgrade independently.

### @react33/react-helpers `0.0.3`

#### Added

- **`decodeJwtPayload<T>(token)`** — base64url-decode the JWT payload section
  and return typed claims (or `null` when malformed).
- **`isJwtExpired(token, skewSec?)`** — compare `exp` against now with optional
  skew. Used by `@react33/react-session` for proactive-refresh decisions
  without a network round-trip.

### @react33/react-persistence `0.0.4`

#### Added

- **`createOpaqueTokenPersistence({ key, storage })`** — minimal read/write/clear
  facade over `sessionStorage` / `localStorage` for refresh tokens.
- **`createLoadRequestPropsFromAuthProfile(profile)`** — bridge consuming
  `AuthProfile` from `@react33/react-networking`: reads a token from cookie /
  storage and renders templated headers (`{token}` substitution) into a
  `LoadRequestProps`. Companion `createLoadRequestPropsFromAuthProfiles` for
  per-API maps.
- **`subscribeStorageKey(storage, key, listener)`** — cross-tab subscription
  helper used by the Bearer session manager.

### @react33/react-networking `0.0.3`

#### Added

- **`RetryBudget = number | Partial<Record<HttpCode, number>>`** — number form
  preserves legacy behavior (5xx/408/429 + throws via `status: 0`); record form
  is exhaustive per status. Honored by `createDataFlow` (registries, server
  route loaders) and `useAsyncFetch`.
- **`onRetry(ctx)` + `RetryContext<Data>`** — awaited between attempts, carries
  `{ status, attempt, response?, error? }` (response / error mutually exclusive).
  Enables token refresh, `Retry-After` parsing, body-level branching.
- **`timeoutMs`** — per-attempt abort that cooperates with retry budgets.
- **`CreateApiRegistryOptions.defaults`** + **`ApiRuntime.defaults`** — registry-
  wide retry / `onRetry` / `timeoutMs`, emitted by `react-networking-generate`
  so the codegen path reaches the same surface as handwritten registries.

#### Changed

- **`shouldRetry`** is now a single pure policy function reused by the hook and
  the server `createDataFlow` — no behavioral regressions in existing tests.

#### Documentation

- **`LoadRequestProps`** JSDoc warns that returned `headers` replace wholesale;
  recommends `mergeRequestProps` for additive cases. The session bridge handles
  this internally.
- **`AuthProfile`** JSDoc cross-refs `createLoadRequestPropsFromAuthProfile` in
  `@react33/react-persistence`.

### @react33/react-session `0.0.3`

> **Note**: `0.0.2` was published and then unpublished from npm; the version
> number is **permanently locked** by npm's unpublish policy. `0.0.3` ships the
> identical surface (no functional change vs the locked `0.0.2`).

#### Added

- **`SessionStore<TSnapshot>`** — strategy-agnostic contract (`subscribe` +
  `getSnapshot`). Each strategy defines its own snapshot shape.
- **Manager**: `subscribe(listener)` + `getSnapshot()` on `BearerSessionManager`.
  Snapshot (`{ hasAccess, hasRefresh, accessPayload }`) is reference-stable
  while nothing changes (memoized) — safe with `useSyncExternalStore`.
- **Subpath**: `@react33/react-session/runtime` exposes
  **`createSessionRuntime({ session })`** returning
  `{ SessionProvider, useSession, useSessionState, session }`. Generic over
  `SessionStore<TSnapshot>` so future cookie / opaque strategies plug in
  without breaking Bearer call sites (type-level expectTypeOf guard test).
- **React** declared as optional peer dependency (only the subpath needs it).

#### Documentation

- README "Strategies side by side" — storage matrix (Bearer vs cookie+`/me` vs
  opaque), where user data lives, what is strategy-exclusive, what changes in
  the UI when cookie-session lands.
- README clarifies single-flight semantics when combining `proactiveRefresh`
  with reactive `onRetry`.

### @react33/react-config `0.0.3`

#### Added

- **`react33Session`** block in `react33.config.schema.json` — strategy +
  runtimeModule + generatedRuntimeOutput + `bearer.*` + `cookie.*` (reserved) +
  retry policy + `persistenceEnvKey`. AJV draft-2020 validated; 7 negative
  cases reject as expected. Codegen consumer not implemented yet — schema
  reserves the field so apps can declare it now.
- JSDoc reinforces the canonical file-naming convention for
  `generatedRuntimeOutput` (`.client.generated.{ts,tsx}`).

### @react33/react-i18n `0.0.6`

#### Changed

- Aligned `@react33/react-helpers` dependency to `^0.0.3` (no functional change).

### @react33/react-generate `0.0.5`

> The local bump to `0.0.5` (commit `27d17e5`) was never published. `0.0.4`
> on npm pinned `@react33/react-networking` to `0.0.2` and `@react33/react-i18n`
> to `0.0.4` — both stale after the `0.0.6` release. Consumers installing
> `react-generate@0.0.4` ended up with `react-networking@0.0.2` nested under
> `react-generate/node_modules`, and the codegen bin resolved that older
> version → emitted `apis.generated.ts` without `apiRuntime.defaults` (added
> in `react-networking@0.0.3`).

#### Fixed

- Publishing `0.0.5` with `workspace:*` so the manifest pins resolve to the
  current published versions: `react-networking@0.0.3`, `react-i18n@0.0.6`,
  `react-theme@0.0.3`, `react-styles@0.0.2`. Closes the duplicate-version
  resolution gap consumers were hitting.

### Monorepo

#### Added

- **`CLAUDE.md`** at repo root codifies the canonical file-naming convention
  (`.client` / `.server` / `.generated` / `.runtime`) with worked examples.
  Matching rule added as Principle 11 in the `react33-architecture` skill.

#### Changed (apps/demo)

- `api.runtime.ts` → `api.runtime.client.ts` (declares `'use client'`).
- `theme.runtime.generated.ts` → `theme.runtime.client.generated.ts`.
- `i18n.runtime.generated.tsx` → `i18n.runtime.client.generated.ts`
  (no JSX literal).
- `pokemon.openapi.client.tsx` → `pokemon.openapi.client.generated.ts`.
- `.gitignore` updated to the canonical paths.
- `react33.config.json` paths (`runtimeModule`, `generatedRuntimeOutput`,
  `hooksOutput`) point at the renamed targets.

## [Unreleased]

### Added

- **`@react33/react-persistence`**: `readClientEnv`, `resolvePersistenceMode` (bundler-neutral env + config).
- **`@react33/react-i18n`**: **`@react33/react-i18n/client`** — `createLocaleRuntime` and `createLocalePersistence` (`persistenceEnvKey` optional in config, not hardcoded to Vite).
- **`@react33/react-i18n`**: **`react-i18n-generate`** also writes **`i18n.runtime.generated.tsx`** (`dictionaries`, runtime hooks, `getInitialLocale`, `persistLocale`).
- **`@react33/react-theme`**: **`createThemePersistence`**, **`react-theme-generate`** → **`theme.runtime.generated.ts`** (Provider, hooks, persistence).
- **`@react33/react-generate`**: fourth step — **`react-theme-generate`** (after styles + i18n).
- **`react33.config.json`**: `runtimeOutput`, `runtimeMode` (i18n), `stylesModule` (theme).
- **`apps/demo`**: wired locale + theme via generated runtimes (`src/lib/i18n.ts`, `src/lib/theme.ts`); removed manual `theme/runtime.ts` and `themePersistence.ts`.

### Added (previous)

- **`@react33/react-networking`**: OpenAPI 3.1+ codegen (`react33Networking.openApi.files`) — Zod schemas, types, SDK, client hooks, optional `init-data` module; runtime helpers `buildPathUrl`, `resolveOpenApiRequest`, `OpenApiHookOverrides`, `parseWithSchema`.
- **`@react33/react-config`**: JSON Schemas for `react33.config.json` and partial `react33-i18n`; home for shared monorepo reference assets ([`data/`](data/)).
- Documentation: React context and re-renders (architecture EN/ES); `@react33/react-context` README (EN/ES).
- Documentation: [i18n messages & typing](docs/i18n-messages.en.md) (EN/ES).
- `@react33/react-persistence`: optional **`ttlMs`** on `createVersionedStorageApi` (envelope `savedAt`); **`subscribeStorageKey`** for cross-tab `storage` events.
- `@react33/react-i18n`: **`defineMessages`** helper for typed message maps.
- Documentation: architecture, SSR matrix, conventions, performance notes (`docs/`).
- Documentation: [TypeScript public entry points](docs/typescript.en.md) (EN/ES).
- CHANGELOG and versioning policy.
- `@react33/react-persistence`: `createVersionedStorageApi` for `{ _v, data }` storage with step migrations (see package README).
- `@react33/react-i18n`: `formatMessage` (ICU via `intl-messageformat`).
- `@react33/react-networking`: opt-in `RequestCache` (`createRequestCache`, `defaultRequestCache`, `buildRequestCacheKey`) and `DynamicOptions.requestCache` (`'global'` \| custom instance) / `cacheTtlMs` / `cacheKey` on `useAsyncFetch`.

### Breaking

- **Config schema host:** `react33.config.schema.json` moved from `@react33/react-styles` to **`@react33/react-config`** (`react33-i18n.config.schema.json` included). Update `$schema`, `.vscode/settings.json`, and `pnpm add -D @react33/react-config` in apps.
- **Config contract:** `lib.config.json` → **`react33.config.json`**; JSON sections `libStyles` / `libI18n` / `libTheme` / `libNetworking` / `libPersistence` → **`react33Styles`** / **`react33I18n`** / **`react33Theme`** / **`react33Networking`** / **`react33Persistence`**. Partial configs: `react33-styles.config.json`. Schema export: `@react33/react-config/react33.config.schema.json`. Monorepo folder `packages/lib-generate` → **`packages/react-generate`**.
- **Config key naming convention:** every path-like key in `react33.config.json` now carries a role+kind suffix — `*Output` (file written, relative to the config file), `*Source` (file read, relative to the config file), `*Dir` (directory scanned, relative to the config file), `*Module` (module specifier relative to the generated file it is emitted into). v0 — **no backward-compat aliases**. Renames: `react33Styles.fromCss` → `cssDir`, `react33Styles.output` → `stylesOutput` (`outputDir` + `outputFile` removed — use a full path in `stylesOutput`); `react33I18n.localesDirectory` → `localesDir`, `generatedTypesOutput` → `typesOutput`, `generatedRuntimeOutput` → `runtimeOutput`; `react33Theme.generatedRuntimeOutput` → `runtimeOutput`, `stylesGeneratedImport` → `stylesModule`; `react33Networking.output` → `registryOutput`; `react33Networking.openApi.files.*.input` → `specSource`, `initData.input` → `initData.source`; `react33Session.generatedRuntimeOutput` → `runtimeOutput`. Update `react33.config.json` in every app. Codegen output is unchanged — regeneration produces byte-identical files.

### Changed

- **CLI binaries:** `lib-generate` → **`react-generate`**, `lib-styles-generate` → **`react-styles-generate`**, `lib-networking-generate` → **`react-networking-generate`** (unified entry lives in `@react33/react-generate`).
- **Breaking (package names):** workspace packages renamed from `@lib/*` to **`@react33/react-*`** (npm scope `@react33`, `react-` prefix) for public publish and to reserve short names for future non-React modules.
- `@react33/react-networking`: tighter public types (`RequestProps`, `DynamicOptions`, `useAsyncFetch` watch/catch); `Expand` preserves `Action`/`Setter` call signatures; safer merge typing in `createDataFlow`.
- Docs: performance notes updated for built-in request cache and ICU bundle; architecture EN/ES cover opt-in cache.

---

## Versioning policy

| Scope | Rule |
|-------|------|
| **Apps** (`apps/demo`, etc.) | Semantic versioning per app when published or tagged. |
| **Packages** (`@react33/react-*`) | **0.0.x** in lockstep while APIs evolve. Document breaking changes in this file under **Unreleased** before tagging. |
| **Codegen** | Changes to `react-generate`, `react-styles-generate`, or `react-networking-generate` that alter output shape are **breaking** for consumers—note in Unreleased. |

When splitting versions per package on npm, align **major** bumps for packages that share types (e.g. `@react33/react-networking` + `@react33/react-persistence` auth types).
