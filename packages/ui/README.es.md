# `@react33/react-ui`

## Uso con Tailwind v4

Si tu app usa Tailwind v4, debes incluir este paquete en el escaneo para que se generen las clases usadas por los componentes. En tu archivo CSS principal:

```css
@import "tailwindcss";
@source "../node_modules/@react33/react-ui";
@source "../node_modules/@react33/react-form";
@source "../node_modules/@react33/react-ui-base";
```

`InputFrame` y los indicadores (check / error) viven en `@react33/react-form`; sin ese `@source`, clases como `right-2` no se generan y el ícono queda desalineado.

Ajustá la ruta según la ubicación de tu CSS (ej. `./node_modules/` si el CSS está en la raíz del proyecto).

## Espíritu del módulo

Este paquete es la **capa visual y de interacción** para aplicaciones internas: formularios, superposiciones, primitivas de layout y patrones de admin. **No** está atado a un dominio de producto concreto (nada de tarjetas de estación, user-card, etc.). La primera oleada migra el kit que venía de `vb-lucy-admin-app`; **gráficos** y stacks grandes de visualización quedan fuera de esa fase.

Objetivos:

- **Suficientemente completo** para dashboards reales (formularios, modales, tabla más adelante, etc.).
- **Poco acoplado** a la infra de estilos: **utilidades Tailwind v4** + **`buildStyles`** desde `@react33/react-styles` (sin `cva` por defecto), no un API semántico en `react-styles`.
- **Progresivo**: cada componente migrado puede exigir pequeños ajustes en `@react33/react-styles` (variables CSS / `@theme`) para que las apps y `apps/demo` compartan el mismo preset.

## Drag and drop y animación (`dnd-kit` vs `motion`)

Siguiendo el criterio usado en `vb-lucy-admin-app`, separamos responsabilidades:

- Usar **`dnd-kit`** cuando hay **interacción de arrastre real** (reordenar listas, mover tarjetas entre columnas, sensores de mouse/touch/teclado, colisión, restricciones, accesibilidad de drag and drop).
- Usar **`motion`** cuando hay **animación visual** (entradas/salidas, hover/tap, transiciones de layout, microinteracciones), sin semántica de drag and drop compleja.
- En componentes combinados, preferir **`dnd-kit` para el estado/interacción** y **`motion` para feedback visual** (por ejemplo, animar opacidad/escala del ítem activo).
- Evitar implementar drag and drop "a mano" solo con `motion`, porque no cubre bien sensores, colisiones ni navegación por teclado.
- Evitar usar `dnd-kit` para animaciones simples sin arrastre; agrega complejidad innecesaria.

## Reglas base (siempre)

1. **`_legacy` es temporal**  
   La copia de trabajo vive en `src/_legacy/`. No importarla desde aplicaciones ni reexportarla. Por componente: implementar **fuera** de `_legacy` y borrar el archivo legacy. Cuando quede vacía, eliminar `_legacy`.

2. **Estilos (patrón por defecto)**  
   - **`{nombre}StyleMap`**: objeto con todas las ramas (`base`, `variant`, `size`, …).  
   - **`{nombre}Styles`**: `buildStyles(styleMap)` a nivel módulo (exportar si sirve fuera).  
   - **`resolvedStyles`**: `buildStyles({ root: […], … })` **en cada render** cuando el resultado depende de props (sin array `deps`; barato y sin clases obsoletas).  
   Reservar **`useBuildStyles`** para memoización rara. Usar **`cn()`** al final para `className` del consumidor. **`react-styles` aporta defaults** (tokens, variables), **no** contrato tipo `button.border.sm`. Si falta un token, mapearlo una vez en styles/theme.

3. **Migración desde vb**  
   Unificar en **mapa → `buildStyles` en módulo → `buildStyles` por render para `resolvedStyles`**. Evitar **`cva`** salvo excepción explícita y documentada.

4. **Plataforma**  
   **Sin APIs de Next.js** (`next/link`, `next/image`, etc.). Enlaces y media con elementos normales o patrones composables (`asChild`, render props).

5. **Lógica del monorepo**  
   Usar `@react33/react-helpers`, `react-context`, `react-hooks`, `react-networking`, `react-i18n` cuando haga falta para comportamiento—no reglas de negocio de una app concreta.

6. **API pública**  
   Solo rutas estables publicadas vía `package.json` `exports` y `src/index.ts`. Los consumidores nunca dependen de `_legacy`.

7. **Demo**  
   Tras migrar una pieza, **`apps/demo`** debe importar desde la entrada publicada del paquete y ejercitar estados reales (focus, disabled, etc.). Incluir cambios mínimos en `react-styles` / theme cuando hagan falta variables nuevas.

## Orden de migración (referencia)

Si no hay otro plan: **átomos** (overlay → icon → button → tag → card) → **tipos de formulario** → **inputs simples** → **modal / pagination / grid** → inputs pesados → **stack de formulario** → **fecha** → layouts si aplica.

## Backlog (fuera de la primera importación vb)

Tabla de datos, tabs, toasts, skeletons, menús, tooltip, drawer, alertas/banners, empty states, textarea dedicado, checkbox/radio primitivos, breadcrumbs, shell de app—documentar antes de implementar.

## Alineación con el IDE / agente

Las mismas reglas están en **`.cursor/rules/react-ui.mdc`** (`globs: packages/ui/**`).

## Componentes migrados

### `Button`

- **Archivo**: `src/components/atoms/button.tsx` → `src/components/atoms/index.ts` → `src/index.ts`.
- **Implementación**: **`buttonStyles`** (`buildStyles` en módulo) + **`resolvedStyles`** (por render: `root` = base + variant + size, `area` opcional). Clases Tailwind/tokens desde `@react33/react-styles`. Base con `transition-colors`, `outline-none`, `disabled:opacity-50`, `disabled:cursor-not-allowed`. Renderiza `<button>` o `<a>` cuando hay `href`; `rel` por defecto `noopener noreferrer` si `target="_blank"`. Props `disabled` con `aria-disabled` en enlaces.
- **Exportaciones**: `Button`, `buttonStyles`, `ButtonVariant`, `ButtonSize`, `CommonButtonProps`, `ButtonProps`, `ButtonElement`.
- **Variantes** (`variant`): `main`, `outline`, `subtle`, `link`, `destructive`.
- **Modificadores**: `active` para estado persistente y `min` para quitar alto, ancho mínimo y padding del tamaño elegido.
- **Tamaños** (`size`): `xs`, `sm`, `md`, `lg`, `icon-xs`, `icon-sm`, `icon`, `icon-lg`.

## Plan de pase del stack de `form`

Estado actual de la migracion desde `src/_legacy` hacia `src/components`.

| Pieza | Estado | Ruta actual | Nota |
|---|---|---|---|
| `useFormApi` | Migrado | `src/components/organisms/form/use-form-api.ts` | Hook base publicado y usado en demo. |
| `Form` | Migrado | `src/components/organisms/form/form.tsx` | Orquesta `useFormApi` + contexto por `space`. |
| `FormProvider` / `useFormState` | Migrado | `src/components/organisms/form/form-provider.tsx` | Contexto para consumo profundo de formularios. |
| `Field` | Migrado | `src/components/molecules/field.tsx` | Wrapper semantico para label, estado y error. |
| `InputText` | Migrado | `src/components/atoms/input-text.tsx` | Cubre modo texto y area. |
| `InputSelect` | Migrado | `src/components/atoms/input-select.tsx` | Reemplaza `input-select-simple` de legacy. |
| `InputDatePicker` | Migrado | `src/components/atoms/input-date-picker.tsx` | Reemplaza `input-date` legacy. |
| `InputChips` | Migrado | `src/components/atoms/input-chips.tsx` | Version definitiva fuera de `_legacy`. |
| `Button` (submit/reset) | Migrado | `src/components/atoms/button.tsx` | Reemplaza uso base de `button-form` sin estado de carga integrado. |
| `form-zod` / `use-form-zod` | Pendiente | `src/_legacy/organisms/form/*` | Falta adaptador oficial para validacion con Zod. |
| `InputSwitch` | Pendiente | `src/_legacy/molecules/input-switch.tsx` | Falta version definitiva en `src/components`. |
| `InputJson` | Pendiente | `src/_legacy/molecules/input-json.tsx` | Falta definir API publica final antes de migrar. |
| `button-form` (loading UX) | Pendiente (evaluacion) | `src/_legacy/atoms/button-form/*` | Decidir si se migra como `Button` loading o como componente separado. |

### Proximo corte recomendado

1. Migrar `InputSwitch` (bajo riesgo, valor inmediato para formularios booleanos).
2. Definir y migrar el adaptador `form-zod` sobre `useFormApi` actual.
3. Resolver `button-form`: integrar loading en `Button` o crear `ButtonForm`.
4. Evaluar `InputJson` (si queda en backlog o se publica como atomo avanzado).
