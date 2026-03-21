# Changelog

All notable changes to this monorepo are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for **applications** (`apps/*`). **Workspace libraries** (`@maurotaliente/react-*`) are currently
**0.0.x** and bumped together when breaking or meaningful changes land; see
[Versioning policy](#versioning-policy) below.

## [Unreleased]

### Added

- Documentation: React context and re-renders (architecture EN/ES); `@maurotaliente/react-context` README (EN/ES).
- Documentation: [i18n messages & typing](docs/i18n-messages.en.md) (EN/ES).
- `@maurotaliente/react-persistence`: optional **`ttlMs`** on `createVersionedStorageApi` (envelope `savedAt`); **`subscribeStorageKey`** for cross-tab `storage` events.
- `@maurotaliente/react-i18n`: **`defineMessages`** helper for typed message maps.
- Documentation: architecture, SSR matrix, conventions, performance notes (`docs/`).
- Documentation: [TypeScript public entry points](docs/typescript.en.md) (EN/ES).
- CHANGELOG and versioning policy.
- `@maurotaliente/react-persistence`: `createVersionedStorageApi` for `{ _v, data }` storage with step migrations (see package README).
- `@maurotaliente/react-i18n`: `formatMessage` (ICU via `intl-messageformat`).
- `@maurotaliente/react-networking`: opt-in `RequestCache` (`createRequestCache`, `defaultRequestCache`, `buildRequestCacheKey`) and `DynamicOptions.requestCache` (`'global'` \| custom instance) / `cacheTtlMs` / `cacheKey` on `useAsyncFetch`.

### Changed

- **CLI binaries:** `lib-generate` → **`react-generate`**, `lib-styles-generate` → **`react-styles-generate`**, `lib-networking-generate` → **`react-networking-generate`** (unified entry lives in `@maurotaliente/react-generate`).
- **Breaking (package names):** workspace packages renamed from `@lib/*` to **`@maurotaliente/react-*`** (npm scope `@maurotaliente`, `react-` prefix) for public publish and to reserve short names for future non-React modules.
- `@maurotaliente/react-networking`: tighter public types (`RequestProps`, `DynamicOptions`, `useAsyncFetch` watch/catch); `Expand` preserves `Action`/`Setter` call signatures; safer merge typing in `createDataFlow`.
- Docs: performance notes updated for built-in request cache and ICU bundle; architecture EN/ES cover opt-in cache.

---

## Versioning policy

| Scope | Rule |
|-------|------|
| **Apps** (`apps/demo`, etc.) | Semantic versioning per app when published or tagged. |
| **Packages** (`@maurotaliente/react-*`) | **0.0.x** in lockstep while APIs evolve. Document breaking changes in this file under **Unreleased** before tagging. |
| **Codegen** | Changes to `react-generate`, `react-styles-generate`, or `react-networking-generate` that alter output shape are **breaking** for consumers—note in Unreleased. |

When splitting versions per package on npm, align **major** bumps for packages that share types (e.g. `@maurotaliente/react-networking` + `@maurotaliente/react-persistence` auth types).
