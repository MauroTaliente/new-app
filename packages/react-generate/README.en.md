# `@react33/react-generate`

## `react-generate`

Orchestrates:

1. **`react-styles-generate`** — emits `styles.generated.ts` from CSS (`react33Styles` in config).
2. **`react-networking-generate`** — emits `apis.generated.ts` and `apis.client.generated.tsx` (`react33Networking` in config).
3. **`react-i18n-generate`** — emits `i18n.generated.ts` from `react33I18n` (locale modules + resolve options).

Forward the same flags as **`react-styles-generate`** (`--config`, `--from-css`, `--watch`, …). For networking, only **`--config`** and **`--output`** are forwarded. For i18n, only **`--config`** is forwarded.

```bash
react-generate
react-generate --config ./react33.config.json
```

Requires **`@react33/react-styles`** and **`@react33/react-networking`** built (`dist/`).
