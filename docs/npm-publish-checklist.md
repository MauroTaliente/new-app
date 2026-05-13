# Publicación npm (monorepo `@maurotaliente/*`)

Checklist para publicar paquetes desde este repo, más un resumen del contenido de los tarballs generados con `pnpm pack` (mayo 2026).

## Antes de publicar

- [ ] `pnpm install` en la raíz del workspace.
- [ ] `pnpm -r build` o al menos build de los paquetes que vas a publicar.
- [ ] `pnpm -r test` (o tests filtrados de los paquetes tocados).
- [ ] Versiones alineadas: subí `version` en cada `package.json` que publiques (o usá [Changesets](https://github.com/changesets/changesets) / flujo equivalente).
- [ ] `npm login` / `pnpm login` a la org o usuario correcto (`publishConfig.access: public` ya está en los paquetes publicables).
- [ ] Publicar con **pnpm desde la raíz** (`pnpm publish -r` o `pnpm --filter <pkg> publish`) para que **`workspace:*` se reescriba** a la versión publicada de dependencias internas. No publiques un paquete suelto con `npm publish` dentro de `packages/*` sin haber publicado antes sus dependencias `@maurotaliente/*`, o el manifest quedará inconsistente.

## Orden recomendado (dependencias internas)

Publicá en este orden (cada fila puede esperar a que termine la anterior; 2 y 3 son independientes entre sí una vez publicado `helpers`).

| # | Paquete npm | Carpeta `packages/` | Depende de (workspace) |
|---|-------------|----------------------|-------------------------|
| 1 | `@maurotaliente/react-helpers` | `helpers` | — |
| 2 | `@maurotaliente/react-context` | `context` | — |
| 3 | `@maurotaliente/react-networking` | `networking` | helpers |
| 4 | `@maurotaliente/react-styles` | `styles` | helpers |
| 5 | `@maurotaliente/react-persistence` | `persistence` | helpers, networking |
| 6 | `@maurotaliente/react-theme` | `theme` | context, styles |
| 7 | `@maurotaliente/react-hooks` | `hooks` | helpers |
| 8 | `@maurotaliente/react-i18n` | `i18n` | helpers, persistence |
| 9 | `@maurotaliente/react-generate` | `lib-generate` | networking, styles |
| 10 | `@maurotaliente/react-ui-base` | `ui-base` | helpers, styles |
| 11 | `@maurotaliente/react-form` | `form` | context, helpers, hooks, networking, styles, ui-base |
| 12 | `@maurotaliente/react-ui` | `ui` | form, ui-base, hooks, networking, styles, helpers, context (+ Radix, etc.) |

**Nota:** `react-generate` vive en `packages/lib-generate`; el tarball se llama `maurotaliente-react-generate-*.tgz`.

## Comandos útiles

Inspeccionar qué entra al tarball sin publicar:

```bash
cd packages/helpers && pnpm pack --pack-destination /tmp/pack-out
tar -tzf /tmp/pack-out/maurotaliente-react-helpers-*.tgz | sort
```

Publicación filtrada (ejemplo):

```bash
pnpm --filter @maurotaliente/react-helpers publish --access public --no-git-checks
```

(Ajustá flags según tu política de git tag y CI.)

## Auditoría `pnpm pack` (resumen)

Se ejecutó `pnpm pack --pack-destination <tmp>` por paquete en un entorno limpio. Los paths dentro del `.tgz` llevan prefijo `package/`. Resultados:

| Carpeta | Nombre tarball | Entradas (aprox.) | Notas |
|---------|----------------|-------------------|--------|
| `helpers` | `maurotaliente-react-helpers-0.0.1.tgz` | 6 | `dist/*`, `package.json`, `README.md`, `README.en.md`, `README.es.md` |
| `context` | `maurotaliente-react-context-0.0.1.tgz` | 8 | Incluye chunks tsup + README\* |
| `networking` | `maurotaliente-react-networking-0.0.1.tgz` | 37 | `dist/bin/generate-apis.*`, muchos chunks, README\* |
| `styles` | `maurotaliente-react-styles-0.0.1.tgz` | 17 | `defaults/*.css`, `lib.config.schema.json`, `lib-styles.config.json`, README\* |
| `persistence` | `maurotaliente-react-persistence-0.0.1.tgz` | 13 | entry `next`, README\* |
| `theme` | `maurotaliente-react-theme-0.0.1.tgz` | 6 | README\* incluidos sin listarlos en `files` |
| `hooks` | `maurotaliente-react-hooks-0.0.1.tgz` | 8 | incluye `next-route-query` |
| `i18n` | `maurotaliente-react-i18n-0.0.1.tgz` | 16 | `lib-i18n.config.schema.json`, subpaths `next` / `next/server` en `dist` |
| `lib-generate` | `maurotaliente-react-generate-0.0.1.tgz` | 8 | solo `dist` + manifests + README\* (`files`: `["dist"]`) |
| `ui-base` | `maurotaliente-react-ui-base-0.0.1.tgz` | 6 | |
| `form` | `maurotaliente-react-form-0.0.1.tgz` | 6 | |
| `ui` | `maurotaliente-react-ui-0.0.1.tgz` | 6 | |

**README EN/ES:** En la práctica del pack actual, `README.en.md` y `README.es.md` **sí** aparecen en el tarball aunque muchos `package.json` solo declaren `"files": ["dist"]`. Para garantizar documentación en el paquete, `helpers` lista explícitamente los tres README en `files`. Podés replicar ese patrón en otros paquetes si querés ser explícitos.

**Binarios:** `react-styles-generate` (styles), `react-networking-generate` (networking), `react-generate` (lib-generate) deben aparecer en `package/dist/bin/` dentro del tarball.

Para repetir la auditoría completa en tu máquina:

```bash
BASE=$(mktemp -d)
for pkg in helpers context networking styles persistence theme hooks i18n lib-generate ui-base form ui; do
  (cd "packages/$pkg" && pnpm pack --pack-destination "$BASE")
done
ls -la "$BASE"
```
