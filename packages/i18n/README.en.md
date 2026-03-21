# @maurotaliente/react-i18n

Typed locale dictionaries, `pickScope` / `getLocale`, rich string interpolation (`ct`), **browser-first** locale resolution (`resolveInitialLocale` via cookie / `localStorage` / URL / `navigator`), and optional **Next.js** adapters.

## Install (monorepo)

`"@maurotaliente/react-i18n": "workspace:*"`

Dependencies: `@maurotaliente/react-helpers`, `@maurotaliente/react-persistence` (already declared).

## Core (`@maurotaliente/react-i18n`)

- `getLocale(dictionaries, lang, fallbackLocale, scope)` — sync lookup; `scope` can be one key or an array to shallow-merge scopes.
- `getAllLocale(dictionaries, lang, fallbackLocale)` — full structure for one language.
- `pickScope(structure, scope)` — lower-level merge.
- `ct(text, values?, components?)` — `{{var}}`, pseudo-tags, `\n` → `<br />`.
- `formatMessage(locale, pattern, values?)` — **ICU MessageFormat** (plurals, `select`, `{name}`) via `intl-messageformat`; returns a plain string. Store ICU patterns in your dictionaries and pass the resolved locale (e.g. `en`, `es`).
- `defineMessages({ ... })` — identity helper for `as const` message maps (see [i18n messages & typing](../../docs/i18n-messages.en.md)).
- `resolveInitialLocale(options)` — **no Next**: URL (first path segment or `urlLocalePattern`) → cookie → `localStorage` → `navigator` → `defaultLocale`. Use `cookieHeader` / `navigatorLanguage` in tests.

## Next (`@maurotaliente/react-i18n/next`, `@maurotaliente/react-i18n/next/server`)

- `useLocaleFromParams`, `useGetLocale`, `useGetAllLocale` — client; `paramName` defaults to `lang`.
- `getLocaleAsync(loaders, scope, lang, fallbackLocale)` — server-only; `loaders` maps locale codes to `() => Promise<structure>`. For large dictionaries per locale, use **dynamic `import()`** inside each loader (e.g. `es: () => import('./locales/es.js').then((m) => m.default)`) so each locale is a separate chunk.

Peers: `react`, `next` (optional for core-only apps).

## `lib.config.json`

`libI18n` shares the **`libPersistence`** block with `libTheme`: `cookieName`, `localStorageKey`, `persistenceMode` (see `@maurotaliente/react-styles` `lib.config.schema.json` → `$defs.libPersistence`). Also: `defaultLocale`, `locales`, `localesDirectory`, `urlLocalePattern`, etc. Dictionaries still load from your app; the config documents keys and conventions.

## Migrating an existing locale module

Replace fixed `module.ts` imports with `getLocale` + dictionaries passed from your app; use `resolveInitialLocale` + `@maurotaliente/react-persistence` instead of ad-hoc cookie reads; keep `ct` as-is.
