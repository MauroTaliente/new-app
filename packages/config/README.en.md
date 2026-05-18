# @react33/react-config

Central place for **cross-cutting configuration** of the `@react33` libraries—not tied to a single feature package.

## What belongs here

- **JSON Schema** for `react33.config.json` (all sections: styles, i18n, theme, networking).
- **Partial schemas** (e.g. `react33-i18n.config.schema.json`) when a tool or editor only edits one section.
- **Reference files** for the monorepo under [`data/`](data/README.md) (fixtures + JSON examples; no codegen output). The demo app config is [`apps/demo/react33.config.json`](../../apps/demo/react33.config.json).

Individual packages (`@react33/react-styles`, `@react33/react-networking`, …) **implement** codegen or runtime for their section; they do not own the global schema.

## App setup

### Editor (recommended)

From the workspace root, map every app config file:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/react33.config.json"],
      "url": "./node_modules/@react33/react-config/react33.config.schema.json"
    }
  ]
}
```

### `$schema` in the JSON file

Optional if the mapping above exists:

```json
{
  "$schema": "./node_modules/@react33/react-config/react33.config.schema.json",
  "react33Styles": { }
}
```

`$schema` stays at the **document root** (JSON Schema convention); it validates the whole file, not only `react33Styles`.

## Install

```bash
pnpm add -D @react33/react-config
```

No runtime import is required unless you add shared TypeScript types here in the future.

## Persistence env vars (`react33Persistence`)

`persistenceMode`, `cookieName`, and optional `persistenceEnvKey` are shared by `react33I18n` and `react33Theme`. Generated runtimes default to `REACT33_I18N_PERSISTENCE` / `REACT33_THEME_PERSISTENCE`.

Those names must be **exposed to the browser** by Vite (`envPrefix`) or Next (`NEXT_PUBLIC_*` + matching `persistenceEnvKey` in config). See **[Persistence env vars — client exposure](../../docs/persistence-env-client.en.md)**.

## Related CLIs

- `react-generate` — styles + networking codegen from `react33.config.json`
- `react-styles-generate` — reads `react33Styles`
- `react-networking-generate` — reads `react33Networking`

See the root [README.en.md](../../README.en.md) for the full config reference.
