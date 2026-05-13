# new-app

Monorepo (`pnpm` workspaces) of React libraries published to npm under the **`@maurotaliente/react-*`** scope, plus a Vite demo that doubles as visual QA.

**Documentation:** [English](README.en.md) · [Español](README.es.md) · [CHANGELOG](CHANGELOG.md)

## Packages

| Package | Purpose |
|---------|---------|
| [`@maurotaliente/react-context`](packages/context) | Tiny typed context factory for state slices |
| [`@maurotaliente/react-helpers`](packages/helpers) | Type guards, deep utilities, path resolvers, dates |
| [`@maurotaliente/react-hooks`](packages/hooks) | Viewport, media, timer, layout, route-query hooks |
| [`@maurotaliente/react-i18n`](packages/i18n) | ICU messages, typed dictionaries, Next.js adapters |
| [`@maurotaliente/react-generate`](packages/lib-generate) | CLI: tokens + API codegen orchestrator |
| [`@maurotaliente/react-networking`](packages/networking) | Typed fetch client, API registry, cache |
| [`@maurotaliente/react-persistence`](packages/persistence) | Storage and cookies with versioning |
| [`@maurotaliente/react-styles`](packages/styles) | Design tokens + `buildStyles` (Tailwind interop) |
| [`@maurotaliente/react-theme`](packages/theme) | Theme runtime: provider, hooks, DOM sync |
| [`@maurotaliente/react-ui-base`](packages/ui-base) | Shared primitives: Button, Icon, Overlay, Dialog, Popover, Tooltip |
| [`@maurotaliente/react-form`](packages/form) | Headless form framework: Form, Field, InputFrame, InputOptions |
| [`@maurotaliente/react-ui`](packages/ui) | Concrete inputs (text, select, slider, ...) + Tabs, DropdownMenu, Toast |

## Adopción gradual

The split is in cascade — each package re-exports its dependency. Install only what you need:

```bash
# Solo primitives (Button/Icon/Overlay + Dialog/Popover/Tooltip)
pnpm add @maurotaliente/react-ui-base @maurotaliente/react-styles

# Framework de form (incluye Button, Icon, Overlay via re-export)
pnpm add @maurotaliente/react-form @maurotaliente/react-styles

# Librería completa (incluye todo lo anterior + inputs concretos + Tabs/DropdownMenu/Toast)
pnpm add @maurotaliente/react-ui @maurotaliente/react-styles
```

## Quick start

```bash
pnpm install
pnpm run build:packages
pnpm run generate   # demo: styles + API modules from lib.config.json
pnpm test
pnpm --filter demo dev
```

See [README.en.md](README.en.md) for the full layout, scripts, codegen workflow, and `lib.config.json` reference.

## Publishing

Manual release with `pnpm publish:packages` from root after `pnpm build:packages && pnpm test`. See [docs/PUBLISHING.md](docs/PUBLISHING.md). CI runs build + tests on every PR (`.github/workflows/ci.yml`).
