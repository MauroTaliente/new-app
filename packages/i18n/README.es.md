# @lib/i18n (Español)

Diccionarios tipados por locale, `pickScope` / `getLocale`, interpolación rica (`ct`), resolución de locale en **navegador** (`resolveInitialLocale` vía cookie / `localStorage` / URL / `navigator`), y adaptadores opcionales para **Next.js**.

## Instalación (monorepo)

`"@lib/i18n": "workspace:*"`

Dependencias: `@lib/helpers`, `@lib/persistence` (ya declaradas).

## Núcleo (`@lib/i18n`)

- `getLocale(dictionaries, lang, fallbackLocale, scope)` — lookup síncrono; `scope` puede ser una clave o un array para fusionar scopes.
- `getAllLocale(dictionaries, lang, fallbackLocale)` — estructura completa para un idioma.
- `pickScope(structure, scope)` — merge de más bajo nivel.
- `ct(text, values?, components?)` — `{{var}}`, pseudo-tags, `\n` → `<br />`.
- `resolveInitialLocale(options)` — sin Next: URL → cookie → `localStorage` → `navigator` → `defaultLocale`. Usá `cookieHeader` / `navigatorLanguage` en tests.

## Next (`@lib/i18n/next`, `@lib/i18n/next/server`)

- `useLocaleFromParams`, `useGetLocale`, `useGetAllLocale` — cliente; `paramName` por defecto `lang`.
- `getLocaleAsync(loaders, scope, lang, fallbackLocale)` — solo servidor; `loaders` mapea códigos a `() => Promise<structure>`.

Peers: `react`, `next` (opcional para apps solo con core).

## `lib.config.json`

`libI18n` comparte con `libTheme` el bloque **`libPersistence`**: `cookieName`, `localStorageKey`, `persistenceMode` (ver `@lib/styles` `lib.config.schema.json` → `$defs.libPersistence`). Además: `defaultLocale`, `locales`, `localesDirectory`, `urlLocalePattern`, etc. El runtime sigue leyendo diccionarios desde tu app; el config documenta claves y convenciones.

## Migrar un módulo de idioma existente

Reemplazá imports fijos de `module.ts` por `getLocale` + diccionarios desde tu app; usá `resolveInitialLocale` + `@lib/persistence` en lugar de lecturas ad hoc de cookies; mantené `ct` igual.
