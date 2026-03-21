# @maurotaliente/react-i18n (Español)

Diccionarios tipados por locale, `pickScope` / `getLocale`, interpolación rica (`ct`), resolución de locale en **navegador** (`resolveInitialLocale` vía cookie / `localStorage` / URL / `navigator`), y adaptadores opcionales para **Next.js**.

## Instalación (monorepo)

`"@maurotaliente/react-i18n": "workspace:*"`

Dependencias: `@maurotaliente/react-helpers`, `@maurotaliente/react-persistence` (ya declaradas).

## Núcleo (`@maurotaliente/react-i18n`)

- `getLocale(dictionaries, lang, fallbackLocale, scope)` — lookup síncrono; `scope` puede ser una clave o un array para fusionar scopes.
- `getAllLocale(dictionaries, lang, fallbackLocale)` — estructura completa para un idioma.
- `pickScope(structure, scope)` — merge de más bajo nivel.
- `ct(text, values?, components?)` — `{{var}}`, pseudo-tags, `\n` → `<br />`.
- `formatMessage(locale, pattern, values?)` — **ICU MessageFormat** (plurales, `select`, `{nombre}`) con `intl-messageformat`; devuelve string plano. Los patrones ICU pueden vivir en el diccionario.
- `defineMessages({ ... })` — helper identidad para mapas `as const` (ver [i18n: mensajes y tipado](../../docs/i18n-messages.es.md)).
- `resolveInitialLocale(options)` — sin Next: URL → cookie → `localStorage` → `navigator` → `defaultLocale`. Usá `cookieHeader` / `navigatorLanguage` en tests.

## Next (`@maurotaliente/react-i18n/next`, `@maurotaliente/react-i18n/next/server`)

- `useLocaleFromParams`, `useGetLocale`, `useGetAllLocale` — cliente; `paramName` por defecto `lang`.
- `getLocaleAsync(loaders, scope, lang, fallbackLocale)` — solo servidor; `loaders` mapea códigos a `() => Promise<structure>`. Para diccionarios grandes, usá **`import()` dinámico** por locale dentro de cada loader.

Peers: `react`, `next` (opcional para apps solo con core).

## `lib.config.json`

`libI18n` comparte con `libTheme` el bloque **`libPersistence`**: `cookieName`, `localStorageKey`, `persistenceMode` (ver `@maurotaliente/react-styles` `lib.config.schema.json` → `$defs.libPersistence`). Además: `defaultLocale`, `locales`, `localesDirectory`, `urlLocalePattern`, etc. El runtime sigue leyendo diccionarios desde tu app; el config documenta claves y convenciones.

## Migrar un módulo de idioma existente

Reemplazá imports fijos de `module.ts` por `getLocale` + diccionarios desde tu app; usá `resolveInitialLocale` + `@maurotaliente/react-persistence` en lugar de lecturas ad hoc de cookies; mantené `ct` igual.
