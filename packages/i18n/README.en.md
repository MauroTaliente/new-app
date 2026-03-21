# @lib/i18n

Typed locale dictionaries, `pickScope` / `getLocale`, rich string interpolation (`ct`), **browser-first** locale resolution (`resolveInitialLocale` via cookie / `localStorage` / URL / `navigator`), and optional **Next.js** adapters.

## Install (monorepo)

`"@lib/i18n": "workspace:*"`

Dependencies: `@lib/helpers`, `@lib/persistence` (already declared).

## Core (`@lib/i18n`)

- `getLocale(dictionaries, lang, fallbackLocale, scope)` — sync lookup; `scope` can be one key or an array to shallow-merge scopes.
- `getAllLocale(dictionaries, lang, fallbackLocale)` — full structure for one language.
- `pickScope(structure, scope)` — lower-level merge.
- `ct(text, values?, components?)` — `{{var}}`, pseudo-tags, `\n` → `<br />`.
- `resolveInitialLocale(options)` — **no Next**: URL (first path segment or `urlLocalePattern`) → cookie → `localStorage` → `navigator` → `defaultLocale`. Use `cookieHeader` / `navigatorLanguage` in tests.

## Next (`@lib/i18n/next`, `@lib/i18n/next/server`)

- `useLocaleFromParams`, `useGetLocale`, `useGetAllLocale` — client; `paramName` defaults to `lang`.
- `getLocaleAsync(loaders, scope, lang, fallbackLocale)` — server-only; `loaders` maps locale codes to `() => Promise<structure>`.

Peers: `react`, `next` (optional for core-only apps).

## `lib.config.json`

`libI18n` shares the **`libPersistence`** block with `libTheme`: `cookieName`, `localStorageKey`, `persistenceMode` (see `@lib/styles` `lib.config.schema.json` → `$defs.libPersistence`). Also: `defaultLocale`, `locales`, `localesDirectory`, `urlLocalePattern`, etc. Dictionaries still load from your app; the config documents keys and conventions.

## Migrating an existing locale module

Replace fixed `module.ts` imports with `getLocale` + dictionaries passed from your app; use `resolveInitialLocale` + `@lib/persistence` instead of ad-hoc cookie reads; keep `ct` as-is.
