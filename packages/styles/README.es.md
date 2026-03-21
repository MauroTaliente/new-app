# @lib/styles (Español)

## `lib-styles-generate` — configuración

El CLI sube desde `cwd` buscando (gana el primero):

- `.lib.config.json`
- `lib.config.json`
- `lib-styles.config.json`

### JSON Schema — autocompletado en el IDE

**No hace falta** repetir `$schema` en cada `lib.config.json` si el repo define **`json.schemas`** en `.vscode/settings.json` (Cursor/VS Code): asocia `**/lib.config.json` con `./node_modules/@lib/styles/lib.config.schema.json` desde la **raíz del workspace** (donde está `node_modules` tras `pnpm install`).

Si abrís solo una subcarpeta como workspace o usás otro editor, podés declarar el schema en el propio JSON (ver ejemplo en [README.en.md](README.en.md)).

Export del paquete: `@lib/styles/lib.config.schema.json` (alias: `lib-styles.schema.json` → mismo archivo).

Usá un objeto `libStyles` con `fromCss`, `output` (ruta del `.ts` generado), `domainsOrder`, `excludeStems`, `metaSourceStem`, `banner`, `verbose`, `watch`, etc. (ejemplos completos en [README.en.md](README.en.md)).

### Rutas

- `fromCss`, `output`, `outputDir` se resuelven **respecto al directorio del archivo de config** (como `tsconfig.json`).

### Orden de dominios (cascada / `var()`)

1. **`--domains` en el CLI** (máxima prioridad)
2. **`libStyles.domainsOrder`** en el config
3. **Si no**: todos los `*.css` en `fromCss`, orden **A→Z** por nombre. Se ignoran `*.generated.css`. **`excludeStems`** solo aplica en este modo de descubrimiento automático.

### Valores por defecto incluidos (`packages/styles/defaults`)

Si apuntás a la carpeta `defaults` **sin** `domainsOrder` ni `--domains` en CLI, el orden fijo es `tokens` → `palette` → `theme`.

### Overrides del CLI

Ver tabla en [README.en.md](README.en.md) (`--from-css`, `-o` / `--output`, `--domains`, `--config`, `--no-config`, `--verbose`, `--watch`, `--no-watch`).

### Ideas futuras

- Patrones glob `include` / `exclude` más fuertes en lugar de listas de stems.
