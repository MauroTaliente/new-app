# new-app

Monorepo (`pnpm` workspaces) of React libraries published to npm under the **`@react33/react-*`** scope, plus a Vite demo that doubles as visual QA.

**Documentation:** [English](README.en.md) · [Español](README.es.md) · [CHANGELOG](CHANGELOG.md)

## Packages

| Package | Purpose |
|---------|---------|
| [`@react33/react-config`](packages/config) | `react33.config.json` JSON Schema + shared reference assets |
| [`@react33/react-context`](packages/context) | Tiny typed context factory for state slices |
| [`@react33/react-helpers`](packages/helpers) | Type guards, deep utilities, path resolvers, dates |
| [`@react33/react-hooks`](packages/hooks) | Viewport, media, timer, layout, route-query hooks |
| [`@react33/react-i18n`](packages/i18n) | ICU messages, typed dictionaries, Next.js adapters |
| [`@react33/react-generate`](packages/react-generate) | CLI: tokens + API codegen orchestrator |
| [`@react33/react-networking`](packages/networking) | Typed fetch client, API registry, cache |
| [`@react33/react-persistence`](packages/persistence) | Storage and cookies with versioning |
| [`@react33/react-styles`](packages/styles) | Design tokens + `buildStyles` (Tailwind interop) |
| [`@react33/react-theme`](packages/theme) | Theme runtime: provider, hooks, DOM sync |
| [`@react33/react-ui-base`](packages/ui-base) | Shared primitives: Button, Icon, Overlay, Dialog, Popover, Tooltip |
| [`@react33/react-form`](packages/form) | Headless form framework: Form, Field, InputFrame, InputOptions |
| [`@react33/react-ui`](packages/ui) | Concrete inputs (text, select, slider, ...) + Tabs, DropdownMenu, Toast |

## Adopción gradual

The split is in cascade — each package re-exports its dependency. Install only what you need:

```bash
# Solo primitives (Button/Icon/Overlay + Dialog/Popover/Tooltip)
pnpm add @react33/react-ui-base @react33/react-styles

# Framework de form (incluye Button, Icon, Overlay via re-export)
pnpm add @react33/react-form @react33/react-styles

# Librería completa (incluye todo lo anterior + inputs concretos + Tabs/DropdownMenu/Toast)
pnpm add @react33/react-ui @react33/react-styles
```

## Quick start

```bash
pnpm install
pnpm run build:packages
pnpm run generate   # demo: styles + API modules from react33.config.json
pnpm test
pnpm --filter demo dev
```

See [README.en.md](README.en.md) for the full layout, scripts, codegen workflow, and `react33.config.json` reference.

## Publishing

Manual release with `pnpm publish:packages` from root after `pnpm build:packages && pnpm test`. See [docs/PUBLISHING.md](docs/PUBLISHING.md). CI runs build + tests on every PR (`.github/workflows/ci.yml`).
