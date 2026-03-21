# `@maurotaliente/react-generate` (Español)

## `react-generate`

Encadena:

1. **`react-styles-generate`** — genera `styles.generated.ts` desde CSS (`libStyles` en el config).
2. **`react-networking-generate`** — genera `apis.generated.ts` y `apis.client.generated.tsx` (`libNetworking` en el config).

Acepta los mismos flags que **`react-styles-generate`**. Para el paso de networking solo se reenvían **`--config`** y **`--output`**.

```bash
react-generate
react-generate --config ./lib.config.json
```

Hace falta tener **`@maurotaliente/react-styles`** y **`@maurotaliente/react-networking`** compilados (`dist/`).
