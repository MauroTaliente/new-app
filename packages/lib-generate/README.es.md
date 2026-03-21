# `@lib/generate` (Español)

## `lib-generate`

Encadena:

1. **`lib-styles-generate`** — genera `styles.generated.ts` desde CSS (`libStyles` en el config).
2. **`lib-networking-generate`** — genera `apis.generated.ts` y `apis.client.generated.tsx` (`libNetworking` en el config).

Acepta los mismos flags que **`lib-styles-generate`**. Para el paso de networking solo se reenvían **`--config`** y **`--output`**.

```bash
lib-generate
lib-generate --config ./lib.config.json
```

Hace falta tener **`@lib/styles`** y **`@lib/networking`** compilados (`dist/`).
