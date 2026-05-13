# `@react33/react-generate`

## `react-generate`

Orchestrates:

1. **`react-styles-generate`** — emits `styles.generated.ts` from CSS (`libStyles` in config).
2. **`react-networking-generate`** — emits `apis.generated.ts` and `apis.client.generated.tsx` (`libNetworking` in config).

Forward the same flags as **`react-styles-generate`** (`--config`, `--from-css`, `--watch`, …). For the networking step, only **`--config`** and **`--output`** are forwarded (paths for the API modules).

```bash
react-generate
react-generate --config ./lib.config.json
```

Requires **`@react33/react-styles`** and **`@react33/react-networking`** built (`dist/`).
