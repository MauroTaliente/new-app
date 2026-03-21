# `@maurotaliente/react-theme`

Runtime de tema para React: **memoria** (context) + **sync DOM** (`body` / `documentElement` / `data-theme`), con enganche **`onThemeChange`** para persistencia (`@maurotaliente/react-persistence`, cookies, Server Actions, etc.).

La **definición** de nombres de tema sigue en **CSS → `react-styles-generate` → `styles.generated.ts`** (una sola fuente de verdad).

## `lib.config.json` — `libTheme`

Junto a `libStyles`, **`libTheme`** comparte **`libPersistence`** con **`libI18n`** (mismas claves posibles). Opcionalmente podés sobreescribir la escritura de cookie (`cookiePath`, `cookieMaxAgeSeconds`, `cookieSameSite`); si no, el demo / tu app usa **defaults en código** (p. ej. path `/`, ~1 año, `lax`). El **nombre del tema por defecto** sigue en **`styles.meta.defaultTheme`** (generado).

## Dependencias internas (recomendado en monorepo)

- `@maurotaliente/react-context` — estado del tema
- `@maurotaliente/react-styles` — tipos `ExtractThemeName` / `ExtractDefaultTheme` alineados al objeto `styles` generado

Instalación típica en una app que ya usa `@maurotaliente/react-styles` y `@maurotaliente/react-persistence`:

```json
{
  "dependencies": {
    "@maurotaliente/react-theme": "workspace:*",
    "@maurotaliente/react-styles": "workspace:*",
    "@maurotaliente/react-persistence": "workspace:*",
    "@maurotaliente/react-context": "workspace:*"
  }
}
```

## Uso

```tsx
import { createThemeRuntime, type ExtractThemeName } from '@maurotaliente/react-theme';
import { styles } from './theme/styles.generated';

type ThemeName = ExtractThemeName<typeof styles>;
// o: import type { ThemeName } from './theme/styles.generated';

export const { ThemeProvider, ThemeBodySync, useTheme } = createThemeRuntime<ThemeName>({
  defaultTheme: styles.meta.defaultTheme,
});
```

```tsx
<ThemeProvider value={initialTheme} onThemeChange={persistTheme}>
  <ThemeBodySync />
  <App />
</ThemeProvider>
```

- **`value`**: tema inicial (lectura previa desde `localStorage` / cookie en el bootstrap, o valor desde el servidor).
- **`onThemeChange`**: se llama en cada tema actual (incluido el primer commit); ideal para persistir sin acoplar la lib.

## Next.js / SSR

`@maurotaliente/react-theme` **no** importa `next/headers`. Patrones:

### A — Cookie legible en el cliente (como el demo con Vite)

En el entry del cliente: `getInitialTheme(defaultTheme)` + `onThemeChange` escribiendo cookie/`localStorage` con `@maurotaliente/react-persistence`.

### B — Valor ya resuelto en el servidor (layout RSC)

1. En el **layout servidor**: `const theme = await readThemeCookie()` (tu helper con `cookies()`).
2. Pintar **HTML** coherente: `<html className={theme} data-theme={theme}>` (o solo `body`).
3. En el **árbol cliente**, `<ThemeProvider value={theme}>` con el **mismo** string para evitar mismatch de hidratación.

`@maurotaliente/react-theme` solo necesita que **`value`** coincida con lo que ya mostró el servidor.

### C — Cookie httpOnly

La lectura solo en servidor: pasás **`value={theme}`** desde el layout; en **`onThemeChange`** llamás una **Server Action** que hace `cookies().set(...)` — sin leer la cookie en el cliente.

## API

| Export | Rol |
|--------|-----|
| `createThemeRuntime` | Factory: `ThemeProvider`, `ThemeBodySync`, `useTheme`, … |
| `applyThemeToDocument` / `mountThemeToDocument` / … | Primitivas DOM (tests, casos avanzados) |
| `ExtractThemeName`, `ExtractDefaultTheme` | Re-export desde `@maurotaliente/react-styles` |

## Tests

```bash
pnpm --filter @maurotaliente/react-theme test
```
