# Tests en el monorepo

## Ubicación

Los tests viven en una carpeta **`test/`** en la raíz del paquete (junto a `src/`), **no** mezclados con el código de producción en `src/`.

Imports desde tests: `../src/<módulo>.js` (resolución ESM coherente con el resto del repo).

## Nombre de archivo: `*.spec.ts`

Usamos el sufijo **`.spec.ts`** (o **`.spec.tsx`** si el test contiene JSX).

### ¿`.spec` o `.test`?

| Patrón | Uso habitual |
|--------|----------------|
| **`*.spec.ts`** | Convención tipo “specification”; común en Jest, Angular, Playwright (`*.spec.ts`). Deja claro que el archivo describe el comportamiento esperado. |
| **`*.test.ts`** | También válido; Vitest y Jest lo reconocen por defecto. |

**En este monorepo** los paquetes que documentan la convención usan **`*.spec.ts`** y Vitest se configura con `include: ['test/**/*.spec.ts']` para no duplicar patrones ni recoger archivos por error.

No es obligatorio a nivel de herramienta: Vitest acepta **ambos**; la elección es de **estilo de equipo**.

## Referencia: `@lib/hooks`

- Config: `packages/hooks/vitest.config.ts`
- Comando: `pnpm --filter @lib/hooks test`
