# new-app (English)

## Layout

| Path | Role |
|------|------|
| `packages/*` | Shared libraries (`@lib/helpers`, `@lib/context`, `@lib/styles`, `@lib/theme`, `@lib/networking`, `@lib/persistence`, `@lib/hooks`, `@lib/i18n`) |
| `apps/*` | Applications (e.g. `demo` Vite app) |
| `docs/` | Team docs (e.g. testing conventions) |

## Requirements

- Node.js compatible with the repo’s `packageManager` (see root `package.json`)
- [pnpm](https://pnpm.io/)

## Scripts (repository root)

| Script | Description |
|--------|-------------|
| `pnpm run build` | Build all workspaces |
| `pnpm run build:packages` | Build every workspace under `packages/*` (used by the demo’s `dev` / `build` via `pnpm -w run build:packages`) |
| `pnpm run generate` | Run **`lib-generate`** in the demo app (CSS tokens + API registry; see `@lib/generate`) |
| `pnpm test` | Run Vitest in all packages that define `test` |
| `pnpm run clean` | Remove `dist` folders (recursive) |

## Configuration: `lib.config.json`

Apps declare shared options in **`lib.config.json`** (often at the app root). JSON Schema for editor hints: `@lib/styles/lib.config.schema.json`.

- **`libStyles`** — CSS → generated `styles.generated.ts` (`lib-styles-generate`). Use **`output`** for the generated file path (relative to the config file).
- **`libNetworking`** — HTTP API registry. Use **`output`** for `apis.generated.ts`; **`hooksOutput`** is optional (defaults to `apis.client.generated.tsx` beside it). Apps typically run **`lib-generate`** (styles + APIs) or **`lib-networking-generate --config lib.config.json`** alone (CLI **`--output`** overrides config).
- **`libI18n`**, **`libTheme`** — locale and theme persistence keys; see package READMEs.

Precedence for generated API paths: **CLI > `lib.config.json` > built-in default**.

## Package READMEs

Each package may ship **`README.md`** (short index) plus **`README.en.md`** / **`README.es.md`** for full documentation.

## Testing

See [docs/testing.en.md](docs/testing.en.md) for conventions (`test/*.spec.ts`, Vitest).
