# `@maurotaliente/react-theme`

React theme **runtime**: in-memory state (context) + **DOM sync** (`body` / `documentElement` / `data-theme`), with **`onThemeChange`** for persistence (`@maurotaliente/react-persistence`, cookies, Server Actions, etc.).

Theme **names** are defined in **CSS → `react-styles-generate` → `styles.generated.ts`** (single source of truth).

## `lib.config.json` — `libTheme`

Alongside `libStyles`, **`libTheme`** shares **`libPersistence`** with **`libI18n`** (same keys). You may override cookie write options (`cookiePath`, `cookieMaxAgeSeconds`, `cookieSameSite`); otherwise the demo / your app uses **code defaults** (e.g. path `/`, ~1 year, `lax`). The **default theme name** comes from **`styles.meta.defaultTheme`** (generated).

## Internal dependencies (monorepo)

- `@maurotaliente/react-context` — theme state
- `@maurotaliente/react-styles` — `ExtractThemeName` / `ExtractDefaultTheme` aligned with generated `styles`

Typical install in an app that already uses `@maurotaliente/react-styles` and `@maurotaliente/react-persistence`:

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

## Usage

```tsx
import { createThemeRuntime, type ExtractThemeName } from '@maurotaliente/react-theme';
import { styles } from './theme/styles.generated';

type ThemeName = ExtractThemeName<typeof styles>;

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

- **`value`**: initial theme (from `localStorage` / cookie during bootstrap, or from the server).
- **`onThemeChange`**: called on every theme change (including first commit); use for persistence without coupling the library.

## Next.js / SSR

`@maurotaliente/react-theme` does **not** import `next/headers`. Patterns:

### A — Cookie readable on the client (like the Vite demo)

Client entry: `getInitialTheme(defaultTheme)` + `onThemeChange` writing cookie / `localStorage` via `@maurotaliente/react-persistence`.

### B — Value resolved on the server (RSC layout)

1. Server **layout**: `const theme = await readThemeCookie()` (your helper using `cookies()`).
2. Paint coherent **HTML**: `<html className={theme} data-theme={theme}>` (or `body` only).
3. Client tree: `<ThemeProvider value={theme}>` with the **same** string to avoid hydration mismatch.

### C — httpOnly cookie

Read only on the server: pass **`value={theme}`** from the layout; in **`onThemeChange`** call a **Server Action** that runs `cookies().set(...)` — no cookie read on the client.

## API

| Export | Role |
|--------|------|
| `createThemeRuntime` | Factory: `ThemeProvider`, `ThemeBodySync`, `useTheme`, … |
| `applyThemeToDocument` / `mountThemeToDocument` / … | DOM primitives (tests, advanced cases) |
| `ExtractThemeName`, `ExtractDefaultTheme` | Re-exported from `@maurotaliente/react-styles` |

## Tests

```bash
pnpm --filter @maurotaliente/react-theme test
```
