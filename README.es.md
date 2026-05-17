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

## Configuración: `react33.config.json`

Las apps suelen usar **`react33.config.json`** en la raíz de la app. Schema JSON y docs compartidas: [`@react33/react-config`](packages/config) (`pnpm add -D @react33/react-config`). Ejemplo canónico completo: [`data/react33.config.json`](data/react33.config.json) (ver [`data/README.md`](data/README.md)).

- **`react33Styles`** — CSS → `styles.generated.ts` (`react-styles-generate`). **`output`**: ruta del `.ts` generado (relativa al config).
- **`react33Networking`** — registro de APIs HTTP. **`output`**: `apis.generated.ts`; **`hooksOutput`** es opcional (por defecto `apis.client.generated.tsx` al lado). En apps suele usarse **`react-generate`** (estilos + APIs) o solo **`react-networking-generate --config react33.config.json`** (el flag **`--output`** pisa el config).
- **`react33I18n`**, **`react33Theme`** — claves de persistencia; ver README de cada paquete.

Orden de precedencia para rutas generadas: **CLI > `react33.config.json` > valor por defecto**.

### Migración desde `lib.config.json`

Renombrá el archivo a `react33.config.json` y las secciones: `libStyles` → `react33Styles`, `libI18n` → `react33I18n`, `libTheme` → `react33Theme`, `libNetworking` → `react33Networking`. Actualizá `$schema` / el mapeo del editor a `@react33/react-config/react33.config.schema.json`. Los CLI usan por defecto `--config react33.config.json`.

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
