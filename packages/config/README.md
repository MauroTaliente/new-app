# @react33/react-config

Shared **configuration contract** for the `@react33` ecosystem: JSON Schemas for `react33.config.json`, partial schemas, and (in this monorepo) pointers to reference files.

**Docs:** [English](README.en.md) · [Español](README.es.md)

## Install (apps)

```bash
pnpm add -D @react33/react-config
```

Runtime packages (`react-styles`, `react-networking`, …) read `react33.config.json` from your app; this package is for **editor validation** and documentation.

## Exports

| Path | Purpose |
|------|---------|
| `@react33/react-config/react33.config.schema.json` | Full app config (`react33Styles`, `react33I18n`, `react33Theme`, `react33Networking`) |
| `@react33/react-config/react33-i18n.config.schema.json` | Partial schema for `react33I18n` only |

## Monorepo reference

Static fixtures and JSON examples (not generated code): [`data/`](data/README.md).

- OpenAPI sample: [`data/fixtures/openapi-3.1-demo.yaml`](data/fixtures/openapi-3.1-demo.yaml)
- Config examples: [`data/examples/`](data/examples/)
- Live app config: [`apps/demo/react33.config.json`](../../apps/demo/react33.config.json)
