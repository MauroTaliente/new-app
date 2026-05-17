# @react33/react-config

Sitio central de **configuración transversal** de las librerías `@react33`—no atado a un solo paquete de features.

## Qué vive acá

- **JSON Schema** de `react33.config.json` (todas las secciones: estilos, i18n, tema, networking).
- **Schemas parciales** (p. ej. `react33-i18n.config.schema.json`) cuando una herramienta solo edita una sección.
- **Archivos de referencia** del monorepo en [`data/`](data/README.md) (fixtures + ejemplos JSON; sin salida de codegen). La config de la demo está en [`apps/demo/react33.config.json`](../../apps/demo/react33.config.json).

Cada paquete (`@react33/react-styles`, `@react33/react-networking`, …) **implementa** codegen o runtime de su sección; no es dueño del schema global.

## Configuración en la app

### Editor (recomendado)

Desde la raíz del workspace:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/react33.config.json"],
      "url": "./node_modules/@react33/react-config/react33.config.schema.json"
    }
  ]
}
```

### `$schema` en el JSON

Opcional si ya tenés el mapping:

```json
{
  "$schema": "./node_modules/@react33/react-config/react33.config.schema.json",
  "react33Styles": { }
}
```

`$schema` va en la **raíz del documento** (convención JSON Schema); valida el archivo entero, no solo `react33Styles`.

## Instalación

```bash
pnpm add -D @react33/react-config
```

No hace falta importarlo en runtime salvo que más adelante agreguemos tipos TS compartidos acá.

## CLIs relacionados

- `react-generate` — codegen de estilos + APIs desde `react33.config.json`
- `react-styles-generate` — lee `react33Styles`
- `react-networking-generate` — lee `react33Networking`

Ver [README.es.md](../../README.es.md) en la raíz para la referencia completa del config.
