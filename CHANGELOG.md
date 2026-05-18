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
