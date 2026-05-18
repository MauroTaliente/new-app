# `@react33/react-theme`

React theme **runtime**: in-memory state (context) + **DOM sync** (`body` / `documentElement` / `data-theme`), with **`onThemeChange`** for persistence (`@react33/react-persistence`, cookies, Server Actions, etc.).

Theme **names** are defined in **CSS → `react-styles-generate` → `styles.generated.ts`** (single source of truth).

## `react33.config.json` — `react33Theme`

Alongside `react33Styles`, **`react33Theme`** shares **`react33Persistence`** with **`react33I18n`** (`cookieName`, `localStorageKey`, `persistenceMode`, optional **`persistenceEnvKey`**). Cookie write options: `cookiePath`, `cookieMaxAgeSeconds`, `cookieSameSite`. Default theme name: **`styles.meta.defaultTheme`** (from CSS codegen).

### Codegen (`react-theme-generate`)

Fourth step of **`react-generate`** (after styles). Writes **`generatedRuntimeOutput`** (default `./src/theme/theme.runtime.generated.ts`): `createThemePersistence`, `ThemeProvider`, hooks, `getInitialTheme`, `persistTheme`.

```bash
react-theme-generate --config react33.config.json
```

### Env override (`persistenceEnvKey`)

Default: `REACT33_THEME_PERSISTENCE`. Must be **exposed to the client** by your bundler or env override has no effect.

| Stack | Required setup |
|-------|----------------|
| **Vite** | `envPrefix: ['VITE_', 'REACT33_']`, `.env`, restart dev |
| **Next.js (client)** | `NEXT_PUBLIC_REACT33_THEME_PERSISTENCE` + `"persistenceEnvKey"` in config, regenerate |

See **[Persistence env vars — client exposure](../../docs/persistence-env-client.en.md)**.

`"persistenceEnvKey": ""` → JSON `persistenceMode` only.

## Internal dependencies (monorepo)

- `@react33/react-context` — theme state
- `@react33/react-styles` — `ExtractThemeName` / `ExtractDefaultTheme` aligned with generated `styles`

Typical install in an app that already uses `@react33/react-styles` and `@react33/react-persistence`:

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

## Usage (manual or generated)

**Generated (recommended):** `pnpm generate` then `import { ThemeProvider, useTheme, getInitialTheme, persistTheme } from './theme/theme.runtime.generated'`.

**Manual:**

```tsx
import { createThemeRuntime, createThemePersistence } from '@react33/react-theme';
import { styles, type ThemeName } from './theme/styles.generated';

const persistence = createThemePersistence<ThemeName>({
  defaultTheme: styles.meta.defaultTheme,
  persistenceMode: 'cookie',
  cookieName: 'theme',
  // persistenceEnvKey: 'NEXT_PUBLIC_THEME_PERSISTENCE', // optional
});

export const { ThemeProvider, ThemeBodySync, useTheme } = createThemeRuntime<ThemeName>({
  defaultTheme: styles.meta.defaultTheme,
});
```

```tsx
<ThemeProvider value={persistence.getInitialTheme()} onThemeChange={persistence.persistTheme}>
  <ThemeBodySync />
  <App />
</ThemeProvider>
```

- **`value`**: initial theme (from persistence or server).
- **`onThemeChange`**: persist on every change (including first commit).

## Next.js / SSR

`@react33/react-theme` does **not** import `next/headers`. Patterns:

### A — Cookie readable on the client (like the Vite demo)

Client entry: `getInitialTheme(defaultTheme)` + `onThemeChange` writing cookie / `localStorage` via `@react33/react-persistence`.

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
| `ExtractThemeName`, `ExtractDefaultTheme` | Re-exported from `@react33/react-styles` |

## Tests

```bash
pnpm --filter @react33/react-theme test
```
