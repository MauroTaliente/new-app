# new-app (Español)

## Estructura

| Ruta | Rol |
|------|-----|
| `packages/*` | Librerías compartidas (`@lib/helpers`, `@lib/context`, `@lib/styles`, `@lib/theme`, `@lib/networking`, `@lib/persistence`, `@lib/hooks`, `@lib/i18n`) |
| `apps/*` | Aplicaciones (p. ej. demo con Vite) |
| `docs/` | Documentación del equipo (convenciones de tests, etc.) |

## Requisitos

- Node compatible con el `packageManager` del `package.json` raíz
- [pnpm](https://pnpm.io/)

## Scripts (raíz del repo)

| Script | Descripción |
|--------|-------------|
| `pnpm run build` | Build de todos los workspaces |
| `pnpm run build:packages` | Build de todos los workspaces bajo `packages/*` (el demo lo usa en `dev`/`build` con `pnpm -w run build:packages`) |
| `pnpm run generate` | Ejecuta **`lib-generate`** en el demo (tokens CSS + APIs; ver `@lib/generate`) |
| `pnpm test` | Vitest en los paquetes que definen `test` |
| `pnpm run clean` | Borra carpetas `dist` (recursivo) |

## Configuración: `lib.config.json`

Las apps suelen usar **`lib.config.json`** en la raíz de la app. Schema JSON para el editor: `@lib/styles/lib.config.schema.json`.

- **`libStyles`** — CSS → `styles.generated.ts` (`lib-styles-generate`). **`output`**: ruta del `.ts` generado (relativa al config).
- **`libNetworking`** — registro de APIs HTTP. **`output`**: `apis.generated.ts`; **`hooksOutput`** es opcional (por defecto `apis.client.generated.tsx` al lado). En apps suele usarse **`lib-generate`** (estilos + APIs) o solo **`lib-networking-generate --config lib.config.json`** (el flag **`--output`** pisa el config).
- **`libI18n`**, **`libTheme`** — claves de persistencia; ver README de cada paquete.

Orden de precedencia para rutas generadas: **CLI > `lib.config.json` > valor por defecto**.

## README por paquete

Cada paquete puede tener **`README.md`** (índice corto) y **`README.en.md`** / **`README.es.md`** con la documentación completa.

## Tests

Convenciones en [docs/testing.es.md](docs/testing.es.md) (`test/*.spec.ts`, Vitest).
