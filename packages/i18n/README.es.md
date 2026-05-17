# @react33/react-i18n (Español)

Diccionarios tipados por locale, `pickScope` / `getLocale`, interpolación rica (`ct`), resolución de locale en **navegador** (`resolveInitialLocale` vía cookie / `localStorage` / URL / `navigator`), y adaptadores opcionales para **Next.js**.

## Instalación (monorepo)

`"@react33/react-i18n": "workspace:*"`

Dependencias: `@react33/react-helpers`, `@react33/react-persistence` (ya declaradas).

## Núcleo (`@react33/react-i18n`)

- `getLocale(dictionaries, lang, fallbackLocale, scope)` — lookup síncrono; `scope` puede ser una clave o un array para fusionar scopes.
- `getAllLocale(dictionaries, lang, fallbackLocale)` — estructura completa para un idioma.
- `pickScope(structure, scope)` — merge de más bajo nivel.
- `ct(text, values?, components?)` — `{{var}}`, pseudo-tags, `\n` → `<br />`.
- `formatMessage(locale, pattern, values?)` — **ICU MessageFormat** (plurales, `select`, `{nombre}`) con `intl-messageformat`; devuelve string plano. Los patrones ICU pueden vivir en el diccionario.
- `defineMessages({ ... })` — helper identidad para mapas `as const` (ver [i18n: mensajes y tipado](../../docs/i18n-messages.es.md)).
- `resolveInitialLocale(options)` — sin Next: URL → cookie → `localStorage` → `navigator` → `defaultLocale`. Usá `cookieHeader` / `navigatorLanguage` en tests.

## Next (`@react33/react-i18n/next`, `@react33/react-i18n/next/server`)

- `useLocaleFromParams`, `useGetLocale`, `useGetAllLocale` — cliente; `paramName` por defecto `lang`.
- `getLocaleAsync(loaders, scope, lang, fallbackLocale)` — solo servidor; `loaders` mapea códigos a `() => Promise<structure>`. Para diccionarios grandes, usá **`import()` dinámico** por locale dentro de cada loader.

Peers: `react`, `next` (opcional para apps solo con core).

## `react33.config.json`

`react33I18n` comparte con `react33Theme` el bloque **`react33Persistence`**: `cookieName`, `localStorageKey`, `persistenceMode` (ver `@react33/react-config` `react33.config.schema.json` → `$defs.react33Persistence`). Además: `defaultLocale`, `locales`, `localesDirectory`, `urlLocalePattern`, etc. El runtime sigue leyendo diccionarios desde tu app; el config documenta claves y convenciones.

## Migrar un módulo de idioma existente

Reemplazá imports fijos de `module.ts` por `getLocale` + diccionarios desde tu app; usá `resolveInitialLocale` + `@react33/react-persistence` en lugar de lecturas ad hoc de cookies; mantené `ct` igual.
