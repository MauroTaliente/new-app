# `@react33/react-theme`

Runtime de tema para React: **memoria** (context) + **sync DOM** (`body` / `documentElement` / `data-theme`), con enganche **`onThemeChange`** para persistencia (`@react33/react-persistence`, cookies, Server Actions, etc.).

La **definición** de nombres de tema sigue en **CSS → `react-styles-generate` → `styles.generated.ts`** (una sola fuente de verdad).

## `react33.config.json` — `react33Theme`

Junto a `react33Styles`, **`react33Theme`** comparte **`react33Persistence`** con **`react33I18n`** (mismas claves posibles). Opcionalmente podés sobreescribir la escritura de cookie (`cookiePath`, `cookieMaxAgeSeconds`, `cookieSameSite`); si no, el demo / tu app usa **defaults en código** (p. ej. path `/`, ~1 año, `lax`). El **nombre del tema por defecto** sigue en **`styles.meta.defaultTheme`** (generado).

### Codegen (`react-theme-generate`)

Cuarto paso de **`react-generate`**. Escribe `runtimeOutput` con Provider, hooks y persistencia.

### Override por env (`persistenceEnvKey`)

Default: `REACT33_THEME_PERSISTENCE`. Tiene que **llegar al cliente** (Vite: `envPrefix`; Next: `NEXT_PUBLIC_*` + clave en config). Guía: **[docs/persistence-env-client.es.md](../../docs/persistence-env-client.es.md)**. `""` desactiva el override.

## Dependencias internas (recomendado en monorepo)

- `@react33/react-context` — estado del tema
- `@react33/react-styles` — tipos `ExtractThemeName` / `ExtractDefaultTheme` alineados al objeto `styles` generado

Instalación típica en una app que ya usa `@react33/react-styles` y `@react33/react-persistence`:

```json
{
  "dependencies": {
    "@react33/react-theme": "workspace:*",
    "@react33/react-styles": "workspace:*",
    "@react33/react-persistence": "workspace:*",
    "@react33/react-context": "workspace:*"
  }
}
```

## Uso

```tsx
import { createThemeRuntime, type ExtractThemeName } from '@react33/react-theme';
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

`@react33/react-theme` **no** importa `next/headers`. Patrones:

### A — Cookie legible en el cliente (como el demo con Vite)

En el entry del cliente: `getInitialTheme(defaultTheme)` + `onThemeChange` escribiendo cookie/`localStorage` con `@react33/react-persistence`.

### B — Valor ya resuelto en el servidor (layout RSC)

1. En el **layout servidor**: `const theme = await readThemeCookie()` (tu helper con `cookies()`).
2. Pintar **HTML** coherente: `<html className={theme} data-theme={theme}>` (o solo `body`).
3. En el **árbol cliente**, `<ThemeProvider value={theme}>` con el **mismo** string para evitar mismatch de hidratación.

`@react33/react-theme` solo necesita que **`value`** coincida con lo que ya mostró el servidor.

### C — Cookie httpOnly

La lectura solo en servidor: pasás **`value={theme}`** desde el layout; en **`onThemeChange`** llamás una **Server Action** que hace `cookies().set(...)` — sin leer la cookie en el cliente.

## API

| Export | Rol |
|--------|-----|
| `createThemeRuntime` | Factory: `ThemeProvider`, `ThemeBodySync`, `useTheme`, … |
| `applyThemeToDocument` / `mountThemeToDocument` / … | Primitivas DOM (tests, casos avanzados) |
| `ExtractThemeName`, `ExtractDefaultTheme` | Re-export desde `@react33/react-styles` |

## Tests

```bash
pnpm --filter @react33/react-theme test
```
