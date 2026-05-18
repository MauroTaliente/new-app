# `@react33/react-generate` (Español)

## `react-generate`

Encadena:

1. **`react-styles-generate`** — genera `styles.generated.ts` desde CSS (`react33Styles` en el config).
2. **`react-networking-generate`** — genera `apis.generated.ts` y `apis.client.generated.tsx` (`react33Networking` en el config).
3. **`react-i18n-generate`** — genera `i18n.generated.ts` e `i18n.runtime.generated.tsx` (`react33I18n`; exports `getInitialLocale` / `persistLocale` desde **i18n ≥ 0.0.4**).
4. **`react-theme-generate`** — genera `theme.runtime.generated.ts` (`react33Theme`).

Acepta los mismos flags que **`react-styles-generate`**. Para networking se reenvían **`--config`** y **`--output`**; para i18n y theme solo **`--config`**.

```bash
react-generate
react-generate --config ./react33.config.json
```

Hace falta tener los paquetes compilados (`dist/`). **`@react33/react-generate@0.0.4`** declara **`@react33/react-i18n@0.0.4`** para que `pnpm codegen` use el generador alineado.
