# `@lib/generate`

## `lib-generate`

Orchestrates:

1. **`lib-styles-generate`** — emits `styles.generated.ts` from CSS (`libStyles` in config).
2. **`lib-networking-generate`** — emits `apis.generated.ts` and `apis.client.generated.tsx` (`libNetworking` in config).

Forward the same flags as **`lib-styles-generate`** (`--config`, `--from-css`, `--watch`, …). For the networking step, only **`--config`** and **`--output`** are forwarded (paths for the API modules).

```bash
lib-generate
lib-generate --config ./lib.config.json
```

Requires **`@lib/styles`** and **`@lib/networking`** built (`dist/`).
