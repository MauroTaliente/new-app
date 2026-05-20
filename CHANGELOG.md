# Changelog

All notable changes to this monorepo are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for **applications** (`apps/*`). **Workspace libraries** (`@react33/react-*`) are currently
**0.0.x** and bumped together when breaking or meaningful changes land; see
[Versioning policy](#versioning-policy) below.

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

### @react33/react-session `0.0.2`

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
- **`react33.config.json`**: `generatedRuntimeOutput`, `runtimeMode` (i18n), `stylesGeneratedImport` (theme).
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
