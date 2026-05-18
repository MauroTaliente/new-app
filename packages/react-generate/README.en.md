# `@react33/react-generate`

## `react-generate`

Orchestrates:

1. **`react-styles-generate`** — emits `styles.generated.ts` from CSS (`react33Styles` in config).
2. **`react-networking-generate`** — emits `apis.generated.ts` and `apis.client.generated.tsx` (`react33Networking` in config).
3. **`react-i18n-generate`** — emits `i18n.generated.ts` and `i18n.runtime.generated.tsx` (`react33I18n`; runtime exports `getInitialLocale` / `persistLocale` from **i18n ≥ 0.0.4**; **`useTf`** ICU from **i18n ≥ 0.0.5**).
4. **`react-theme-generate`** — emits `theme.runtime.generated.ts` (`react33Theme`).

Forward the same flags as **`react-styles-generate`** (`--config`, `--from-css`, `--watch`, …). For networking, only **`--config`** and **`--output`** are forwarded. For i18n and theme, only **`--config`** is forwarded.

```bash
react-generate
react-generate --config ./react33.config.json
```

Requires workspace packages built (`dist/`). Published **`@react33/react-generate@0.0.5`** installs **`@react33/react-i18n@0.0.5`** as a dependency so `pnpm codegen` uses the matching generator.
