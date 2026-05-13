# new-app (Español)

## Estructura

| Ruta | Rol |
|------|-----|
| `packages/*` | Librerías compartidas (`@react33/react-*`, incluye `react-generate`) |
| `apps/*` | Aplicaciones (p. ej. demo con Vite) |
| `docs/` | Arquitectura, tests, rendimiento ([índice](docs/architecture.es.md)) |

## Requisitos

- Node compatible con el `packageManager` del `package.json` raíz
- [pnpm](https://pnpm.io/)

## Scripts (raíz del repo)

| Script | Descripción |
|--------|-------------|
| `pnpm run build` | Build de todos los workspaces |
| `pnpm run build:packages` | Build de todos los workspaces bajo `packages/*` (el demo lo usa en `dev`/`build` con `pnpm -w run build:packages`) |
| `pnpm run generate` | Ejecuta **`react-generate`** en el demo (tokens CSS + APIs; ver `@react33/react-generate`) |
| `pnpm test` | Vitest en los paquetes que definen `test` |
| `pnpm run clean` | Borra carpetas `dist` (recursivo) |

## Configuración: `lib.config.json`

Las apps suelen usar **`lib.config.json`** en la raíz de la app. Schema JSON para el editor: `@react33/react-styles/lib.config.schema.json`.

- **`libStyles`** — CSS → `styles.generated.ts` (`react-styles-generate`). **`output`**: ruta del `.ts` generado (relativa al config).
- **`libNetworking`** — registro de APIs HTTP. **`output`**: `apis.generated.ts`; **`hooksOutput`** es opcional (por defecto `apis.client.generated.tsx` al lado). En apps suele usarse **`react-generate`** (estilos + APIs) o solo **`react-networking-generate --config lib.config.json`** (el flag **`--output`** pisa el config).
- **`libI18n`**, **`libTheme`** — claves de persistencia; ver README de cada paquete.

Orden de precedencia para rutas generadas: **CLI > `lib.config.json` > valor por defecto**.

## npm

Paquetes con scope **`@react33/react-*`** (v0.0.1). Ver [Publicación en npm](docs/PUBLISHING.md).

## README por paquete

Cada paquete puede tener **`README.md`** (índice corto) y **`README.en.md`** / **`README.es.md`** con la documentación completa.

## Documentación

| Doc | Descripción |
|-----|-------------|
| [Arquitectura y límites](docs/architecture.es.md) | Mapa de paquetes, matriz SSR, convenciones, escape hatches |
| [i18n: mensajes y tipado](docs/i18n-messages.es.md) | `formatMessage` vs `ct`, `defineMessages`, locales perezosos |
| [Rendimiento](docs/performance.es.md) | Modelo de networking, bundle |
| [TypeScript (entrada pública)](docs/typescript.es.md) | Tipos por paquete (`@react33/react-networking`, `@react33/react-persistence`, …) |
| [Tests](docs/testing.md) | Convenciones Vitest |
| [CHANGELOG](CHANGELOG.md) | Versiones y política |
| [Publicación en npm](docs/PUBLISHING.md) | `pnpm publish` para `@react33/react-*` |

## Tests

Convenciones en [docs/testing.es.md](docs/testing.es.md) (`test/*.spec.ts`, Vitest).
