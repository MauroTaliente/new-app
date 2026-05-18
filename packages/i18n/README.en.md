# @react33/react-i18n

Typed locale dictionaries, `pickScope` / `getLocale`, rich string interpolation (`ct`), **browser-first** locale resolution (`resolveInitialLocale` via cookie / `localStorage` / URL / `navigator`), and optional **Next.js** adapters.

## Install (monorepo)

`"@react33/react-i18n": "workspace:*"`

Dependencies: `@react33/react-helpers`, `@react33/react-persistence` (already declared).

## Core (`@react33/react-i18n`)

- `getLocale(dictionaries, lang, fallbackLocale, scope)` — sync lookup; `scope` can be one key or an array to shallow-merge scopes.
- `getAllLocale(dictionaries, lang, fallbackLocale)` — full structure for one language.
- `pickScope(structure, scope)` — lower-level merge.
- `ct(text, values?, components?)` — `{{var}}`, pseudo-tags, `\n` → `<br />`.
- `formatMessage(locale, pattern, values?)` — **ICU MessageFormat** (plurals, `select`, `{name}`) via `intl-messageformat`; returns a plain string. Store ICU patterns in your dictionaries and pass the resolved locale (e.g. `en`, `es`).
- `defineMessages({ ... })` — identity helper for `as const` message maps (see [i18n messages & typing](../../docs/i18n-messages.en.md)).
- `resolveInitialLocale(options)` — **no Next**: URL (first path segment or `urlLocalePattern`) → cookie → `localStorage` → `navigator` → `defaultLocale`. Use `cookieHeader` / `navigatorLanguage` in tests.

## Next (`@react33/react-i18n/next`, `@react33/react-i18n/next/server`)

- `useLocaleFromParams`, `useGetLocale`, `useGetAllLocale` — client; `paramName` defaults to `lang`.
- `getLocaleAsync(loaders, scope, lang, fallbackLocale)` — server-only; `loaders` maps locale codes to `() => Promise<structure>`. For large dictionaries per locale, use **dynamic `import()`** inside each loader (e.g. `es: () => import('./locales/es.js').then((m) => m.default)`) so each locale is a separate chunk.

Peers: `react`, `next` (optional for core-only apps).

## `react33.config.json`

`react33I18n` shares the **`react33Persistence`** block with `react33Theme`: `cookieName`, `localStorageKey`, `persistenceMode` (see `@react33/react-config` `react33.config.schema.json` → `$defs.react33Persistence`). Also: `defaultLocale`, `locales`, `localesDirectory`, `generatedTypesOutput`, `urlLocalePattern`, etc.

### Codegen (`react-i18n-generate`)

CLI and the third step of **`react-generate`**. Reads `react33I18n` and writes:

- `generatedTypesOutput` (default `./src/lib/i18n/i18n.generated.ts`) — locale constants, `resolveLocaleOptions`, scoped message key types.
- `generatedRuntimeOutput` (default `./src/lib/i18n/i18n.runtime.generated.tsx`) — `dictionaries` barrel, `LocaleProvider`, hooks, `getInitialLocale`, `persistLocale` (uses `@react33/react-i18n/client`).

```bash
react-i18n-generate --config react33.config.json
```

Dictionaries remain source in your app (`localesDirectory`); the generator does not translate strings.

### SPA runtime (`@react33/react-i18n/client`)

`createLocaleRuntime` + `createLocalePersistence` for apps that do not use Next locale segments. Generated `i18n.runtime.generated.tsx` wires both from `react33I18n` persistence keys.

### Env override (`persistenceEnvKey`)

Codegen defaults to `REACT33_I18N_PERSISTENCE`. That name is **not** automatically visible in the browser — the bundler must expose it.

| Stack | What you must do |
|-------|------------------|
| **Vite** | `envPrefix: ['VITE_', 'REACT33_']` in `vite.config.ts`, var in `.env`, restart dev server |
| **Next.js (client)** | `NEXT_PUBLIC_REACT33_I18N_PERSISTENCE` in `.env` + matching `"persistenceEnvKey"` in config, then `pnpm generate` |

Full checklist and troubleshooting: **[Persistence env vars — client exposure](../../docs/persistence-env-client.en.md)**.

Disable env override: `"persistenceEnvKey": ""` (uses only `persistenceMode` from JSON).

## Migrating an existing locale module

Replace fixed `module.ts` imports with `getLocale` + dictionaries passed from your app; use `resolveInitialLocale` + `@react33/react-persistence` instead of ad-hoc cookie reads; keep `ct` as-is.
