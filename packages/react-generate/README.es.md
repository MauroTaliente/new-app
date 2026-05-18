# `@react33/react-generate` (Español)

## `react-generate`

Encadena:

1. **`react-styles-generate`** — genera `styles.generated.ts` desde CSS (`react33Styles` en el config).
2. **`react-networking-generate`** — genera `apis.generated.ts` y `apis.client.generated.tsx` (`react33Networking` en el config).
3. **`react-i18n-generate`** — genera `i18n.generated.ts` desde `react33I18n` (módulos por locale + opciones de resolución).

Acepta los mismos flags que **`react-styles-generate`**. Para networking se reenvían **`--config`** y **`--output`**; para i18n solo **`--config`**.

```bash
react-generate
react-generate --config ./react33.config.json
```

Hace falta tener **`@react33/react-styles`** y **`@react33/react-networking`** compilados (`dist/`).
