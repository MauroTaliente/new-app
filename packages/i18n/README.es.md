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

`react33I18n` comparte con `react33Theme` el bloque **`react33Persistence`**: `cookieName`, `localStorageKey`, `persistenceMode`, `persistenceEnvKey` opcional (ver `@react33/react-config` → `$defs.react33Persistence`). Además: `defaultLocale`, `locales`, `localesDirectory`, `generatedTypesOutput`, `generatedRuntimeOutput`, `runtimeMode`, `urlLocalePattern`, etc.

### Codegen (`react-i18n-generate`)

CLI y tercer paso de **`react-generate`**. Escribe:

- `generatedTypesOutput` — constantes, `resolveLocaleOptions`, tipos desde `locales/<defaultLocale>.ts`.
- `generatedRuntimeOutput` — `dictionaries`, `LocaleProvider`, hooks, `getInitialLocale`, `persistLocale` (`@react33/react-i18n/client`).

### Override por env (`persistenceEnvKey`)

Por defecto el codegen usa `REACT33_I18N_PERSISTENCE`. **No basta** con ponerla en `.env`: el bundler tiene que exponerla al cliente.

| Stack | Qué hacer |
|-------|-----------|
| **Vite** | `envPrefix: ['VITE_', 'REACT33_']` en `vite.config.ts`, variable en `.env`, reiniciar dev |
| **Next (cliente)** | `NEXT_PUBLIC_REACT33_I18N_PERSISTENCE` + `"persistenceEnvKey"` igual en `react33.config.json`, luego `pnpm generate` |

Guía completa: **[Variables de persistencia en el cliente](../../docs/persistence-env-client.es.md)**.

`"persistenceEnvKey": ""` → solo `persistenceMode` del JSON.

```bash
react-i18n-generate --config react33.config.json
```

Los diccionarios siguen siendo fuente en tu app (`localesDirectory`); el generador no traduce ni duplica strings.

### Runtime SPA (`@react33/react-i18n/client`)

`createLocaleRuntime` + `createLocalePersistence` para apps sin segmento `lang` en la URL.

## Migrar un módulo de idioma existente

Reemplazá imports fijos de `module.ts` por `getLocale` + diccionarios desde tu app; usá `resolveInitialLocale` + `@react33/react-persistence` en lugar de lecturas ad hoc de cookies; mantené `ct` igual.
