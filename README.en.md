# new-app (English)

## Layout

| Path | Role |
|------|------|
| `packages/*` | Shared libraries (`@maurotaliente/react-*`, including `react-generate`) |
| `apps/*` | Applications (e.g. `demo` Vite app) |
| `docs/` | Architecture, testing, performance ([index](docs/architecture.en.md)) |

## Requirements

- Node.js compatible with the repo’s `packageManager` (see root `package.json`)
- [pnpm](https://pnpm.io/)

## Scripts (repository root)

| Script | Description |
|--------|-------------|
| `pnpm run build` | Build all workspaces |
| `pnpm run build:packages` | Build every workspace under `packages/*` (used by the demo’s `dev` / `build` via `pnpm -w run build:packages`) |
| `pnpm run generate` | Run **`react-generate`** in the demo app (CSS tokens + API registry; see `@maurotaliente/react-generate`) |
| `pnpm test` | Run Vitest in all packages that define `test` |
| `pnpm run clean` | Remove `dist` folders (recursive) |

## Configuration: `lib.config.json`

Apps declare shared options in **`lib.config.json`** (often at the app root). JSON Schema for editor hints: `@maurotaliente/react-styles/lib.config.schema.json`.

- **`libStyles`** — CSS → generated `styles.generated.ts` (`react-styles-generate`). Use **`output`** for the generated file path (relative to the config file).
- **`libNetworking`** — HTTP API registry. Use **`output`** for `apis.generated.ts`; **`hooksOutput`** is optional (defaults to `apis.client.generated.tsx` beside it). Apps typically run **`react-generate`** (styles + APIs) or **`react-networking-generate --config lib.config.json`** alone (CLI **`--output`** overrides config).
- **`libI18n`**, **`libTheme`** — locale and theme persistence keys; see package READMEs.

Precedence for generated API paths: **CLI > `lib.config.json` > built-in default**.

## npm

Scoped packages **`@maurotaliente/react-*`** (v0.0.1). See [Publishing](docs/PUBLISHING.md) for `pnpm publish`.

## Package READMEs

Each package may ship **`README.md`** (short index) plus **`README.en.md`** / **`README.es.md`** for full documentation.

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture & boundaries](docs/architecture.en.md) | Package map, SSR matrix, loading/error conventions, escape hatches |
| [i18n messages & typing](docs/i18n-messages.en.md) | `formatMessage` vs `ct`, `defineMessages`, lazy locales |
| [Performance](docs/performance.en.md) | Networking model, bundle notes |
| [TypeScript entry points](docs/typescript.en.md) | Public types per package (`@maurotaliente/react-networking`, `@maurotaliente/react-persistence`, …) |
| [Testing](docs/testing.en.md) | Vitest layout (`test/*.spec.ts`) |
| [CHANGELOG](CHANGELOG.md) | Releases and versioning policy |
| [Publishing to npm](docs/PUBLISHING.md) | `pnpm publish` for `@maurotaliente/react-*` |

## Testing

See [docs/testing.en.md](docs/testing.en.md) for conventions (`test/*.spec.ts`, Vitest).
