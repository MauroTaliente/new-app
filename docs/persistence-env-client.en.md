# Persistence env vars — reaching the browser client

Generated runtimes (`i18n.runtime.generated.tsx`, `theme.runtime.generated.ts`) can read an **optional** env var to override `persistenceMode` from `react33.config.json` (`cookie` vs `localStorage`).

Codegen defaults:

| Section | Default env key |
|---------|-----------------|
| `react33I18n` | `REACT33_I18N_PERSISTENCE` |
| `react33Theme` | `REACT33_THEME_PERSISTENCE` |

**Important:** defining `REACT33_*=cookie` in `.env` is **not enough**. The bundler must **expose** that name to client code (`import.meta.env` / inlined `process.env`). If it does not, `readClientEnv()` never sees your value and the app keeps using `persistenceMode` from JSON — which looks like “env does nothing”.

Disable env override entirely: `"persistenceEnvKey": ""` in `react33I18n` / `react33Theme`.

---

## Vite

### What Vite does

By default, only variables whose names start with **`VITE_`** are copied into **`import.meta.env`** in the **browser** bundle.

`REACT33_*` is **not** included unless you extend the prefix list.

### Setup (required for default `REACT33_*` keys)

1. **`vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: ['VITE_', 'REACT33_'],
  // ...
});
```

2. **`.env`** (project root, same folder as `vite.config.ts`)

```env
REACT33_THEME_PERSISTENCE=cookie
REACT33_I18N_PERSISTENCE=cookie
```

3. **Restart** `vite` / `vite dev` after changing `.env` or `envPrefix`.

4. **TypeScript (optional):** `src/vite-env.d.ts`

```ts
interface ImportMetaEnv {
  readonly REACT33_THEME_PERSISTENCE?: 'localStorage' | 'cookie';
  readonly REACT33_I18N_PERSISTENCE?: 'localStorage' | 'cookie';
}
```

### Verify in the browser

DevTools console:

```js
import.meta.env.REACT33_THEME_PERSISTENCE
// → "cookie" | "localStorage" | undefined
```

If `undefined`, the var is **not** exposed — check `envPrefix` and `.env`, then restart.

### Alternative: stay on `VITE_` only

If you do not want `envPrefix: ['REACT33_']`, set explicit keys in config:

```json
"react33Theme": {
  "persistenceEnvKey": "VITE_THEME_PERSISTENCE"
}
```

and use only `VITE_*` in `.env` (works with Vite defaults).

---

## Next.js

### What Next.js does

Only env vars prefixed with **`NEXT_PUBLIC_`** are inlined into **client** bundles.

`REACT33_THEME_PERSISTENCE` in `.env` is visible on the **server** (`process.env`) but **not** in Client Components unless you rename or override the key.

### Setup (recommended)

1. **`.env.local`**

```env
NEXT_PUBLIC_REACT33_THEME_PERSISTENCE=cookie
NEXT_PUBLIC_REACT33_I18N_PERSISTENCE=cookie
```

2. **`react33.config.json`** — align codegen with the public name:

```json
"react33Theme": {
  "persistenceMode": "cookie",
  "persistenceEnvKey": "NEXT_PUBLIC_REACT33_THEME_PERSISTENCE"
},
"react33I18n": {
  "persistenceEnvKey": "NEXT_PUBLIC_REACT33_I18N_PERSISTENCE"
}
```

3. Run **`pnpm generate`** so the runtime imports the updated key.

4. **Restart** `next dev` after env changes.

### Server-only apps

If persistence runs only on the server, you can use `REACT33_*` without `NEXT_PUBLIC_` and pass `env` manually into `createThemePersistence` / `createLocalePersistence`. The **generated** SPA runtimes expect client-readable env when using `getInitialTheme` / `getInitialLocale` in the browser.

---

## Without env override (simplest)

Use only `react33.config.json`:

```json
"react33Theme": {
  "persistenceMode": "cookie",
  "cookieName": "my-theme"
},
"react33I18n": {
  "persistenceMode": "cookie",
  "cookieName": "locale"
}
```

Or disable the generated env hook:

```json
"persistenceEnvKey": ""
```

No `.env` wiring required.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Changed `.env` but mode unchanged | Var not exposed to client | Vite: `envPrefix` + restart. Next: `NEXT_PUBLIC_` + `persistenceEnvKey` in config + regenerate |
| `import.meta.env.REACT33_*` is `undefined` (Vite) | Missing `REACT33_` in `envPrefix` | Add to `vite.config.ts`, restart |
| Works in dev, not production | `.env` not loaded in CI/host | Set env in deploy platform; rebuild |
| Env works on server, not in browser (Next) | Used `REACT33_*` without `NEXT_PUBLIC_` | Rename or override `persistenceEnvKey` |
| Want zero env magic | — | `"persistenceEnvKey": ""` or omit override; use `persistenceMode` only |

---

## Reference (demo app)

See [`apps/demo/vite.config.ts`](../apps/demo/vite.config.ts) (`envPrefix`), [`apps/demo/.env.example`](../apps/demo/.env.example), and [`apps/demo/src/vite-env.d.ts`](../apps/demo/src/vite-env.d.ts).
