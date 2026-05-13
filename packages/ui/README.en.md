# `@maurotaliente/react-ui`

## Usage with Tailwind v4

If your app uses Tailwind v4, add this package to the content scan so that the components’ utility classes are generated. In your main CSS file:

```css
@import "tailwindcss";
@source "../node_modules/@maurotaliente/react-ui";
```

Adjust the path relative to your CSS file’s location (e.g. `./node_modules/` if the CSS is at the project root).

## Spirit of the module

This package is the **visual and interaction layer** for internal apps: forms, overlays, layout primitives, and admin patterns. It is **not** tied to a specific product domain (no station cards, user cards, etc.). The first migration wave focuses on the former `vb-lucy-admin-app` UI kit; **charts** and large visualization stacks are out of scope for that wave.

Goals:

- **Complete enough** for real dashboards (forms, modals, tables later, etc.).
- **Loosely coupled** to styling infrastructure: **Tailwind v4 utilities** + **`buildStyles`** from `@maurotaliente/react-styles` (no `cva` by default), not a bespoke semantic style API in `react-styles`.
- **Progressive**: each migrated component may require small additions to `@maurotaliente/react-styles` (CSS variables / `@theme`) so apps and `apps/demo` share one preset.

## Drag-and-drop and animation (`dnd-kit` vs `motion`)

Following the approach used in `vb-lucy-admin-app`, responsibilities stay separate:

- Use **`dnd-kit`** for **real drag-and-drop interaction** (sortable lists, moving cards across columns, mouse/touch/keyboard sensors, collision detection, drag constraints, DnD accessibility).
- Use **`motion`** for **visual animation** (enter/exit, hover/tap, layout transitions, micro-interactions) when no complex drag semantics are needed.
- In combined components, prefer **`dnd-kit` for interaction/state** and **`motion` for visual feedback** (for example, animating opacity/scale for the active dragged item).
- Avoid implementing drag-and-drop purely with `motion`; it does not cover sensors, collision logic, or keyboard workflows well.
- Avoid using `dnd-kit` for simple animations without dragging, since it adds unnecessary complexity.

## Base rules (always)

1. **`_legacy` is temporary**  
   Staging copy lives under `src/_legacy/`. Do not import it from applications or re-export it. For each component: implement outside `_legacy`, then delete the legacy file. Remove `_legacy` when empty.

2. **Styling (default pattern)**  
   - **`{name}StyleMap`**: object with all branches (`base`, `variant`, `size`, …).  
   - **`{name}Styles`**: `buildStyles(styleMap)` at module scope (export when useful).  
   - **`resolvedStyles`**: `buildStyles({ root: […], … })` **each render** when output depends on props (no `deps` array; cheap and avoids stale classes).  
   Use **`useBuildStyles`** only for rare memoization needs. Use **`cn()`** for consumer `className` overrides at the end. **`react-styles` provides defaults** (tokens, variables), **not** a public contract like `button.border.sm`. If a token is missing as a utility, map it once in styles/theme.

3. **Migrating from vb**  
   Replace ad-hoc patterns with **style map → module `buildStyles` → per-render `buildStyles` for `resolvedStyles`**. Prefer **no `cva`** unless an explicit, documented exception.

4. **Platform**  
   **No Next.js** APIs here (`next/link`, `next/image`, etc.). Use plain elements or composable patterns (`asChild`, render props) for links and media.

5. **Monorepo logic**  
   Use `@maurotaliente/react-helpers`, `react-context`, `react-hooks`, `react-networking`, `react-i18n` when needed for behavior—not for app-specific business rules.

6. **Public API**  
   Only stable paths are published via `package.json` `exports` and `src/index.ts`. Consumers never depend on `_legacy`.

7. **Demo**  
   After migrating a piece, **`apps/demo`** should import from the published package entry and exercise real states (focus, disabled, etc.). Co-locate minimal `react-styles` / theme changes when new variables are required.

## Migration order (reference)

When no other plan overrides: **atoms** (overlay → icon → button → tag → card) → form **types** → simple **inputs** → **modal / pagination / grid** → heavier inputs → **form stack** → **date** → layouts if needed.

## Backlog (not in the first vb import)

Data table, tabs, toasts, skeletons, menus, tooltip, drawer, alerts/banners, empty states, dedicated textarea, checkbox/radio primitives, breadcrumbs, app shell—track before building.

## IDE / agent alignment

The same rules are enforced for Cursor in **`.cursor/rules/react-ui.mdc`** (`globs: packages/ui/**`).

## Migrated components

### `Button`

- **Files**: `src/components/atoms/button.tsx` → `src/components/atoms/index.ts` → `src/index.ts`.
- **Implementation**: **`buttonStyles`** (module `buildStyles`) + **`resolvedStyles`** (per-render: `root` = base + variant + size, `area` optional). Tailwind + tokens from `@maurotaliente/react-styles`. Base includes `transition-colors`, `outline-none`, `disabled:opacity-50`, `disabled:cursor-not-allowed`. Renders `<button>` or `<a>` when `href` is set; `rel` defaults to `noopener noreferrer` for `target="_blank"`. `disabled` prop uses `aria-disabled` on links.
- **Exports**: `Button`, `buttonStyles`, `ButtonVariant`, `ButtonSize`, `CommonButtonProps`, `ButtonProps`, `ButtonElement`.
- **Variants** (`variant`): `main`, `outline`, `subtle`, `link`, `destructive`.
- **Modifiers**: `active` for persistent selected state and `min` to remove height, minimum width, and padding from the chosen size.
- **Sizes** (`size`): `xs`, `sm`, `md`, `lg`, `icon-xs`, `icon-sm`, `icon`, `icon-lg`.

## Form stack migration plan

Current migration status from `src/_legacy` into `src/components`.

| Piece | Status | Current path | Note |
|---|---|---|---|
| `useFormApi` | Migrated | `src/components/organisms/form/use-form-api.ts` | Core hook is published and used in demo. |
| `Form` | Migrated | `src/components/organisms/form/form.tsx` | Orchestrates `useFormApi` and per-`space` context wiring. |
| `FormProvider` / `useFormState` | Migrated | `src/components/organisms/form/form-provider.tsx` | Context layer for deeply nested form consumers. |
| `Field` | Migrated | `src/components/molecules/field.tsx` | Semantic wrapper for label, state, and error rendering. |
| `InputText` | Migrated | `src/components/atoms/input-text.tsx` | Covers text and textarea mode. |
| `InputSelect` | Migrated | `src/components/atoms/input-select.tsx` | Replaces legacy `input-select-simple`. |
| `InputDatePicker` | Migrated | `src/components/atoms/input-date-picker.tsx` | Replaces legacy `input-date`. |
| `InputChips` | Migrated | `src/components/atoms/input-chips.tsx` | Final implementation outside `_legacy`. |
| `Button` (submit/reset) | Migrated | `src/components/atoms/button.tsx` | Covers base `button-form` usage without built-in loading state. |
| `form-zod` / `use-form-zod` | Pending | `src/_legacy/organisms/form/*` | Missing official Zod adapter on top of current API. |
| `InputSwitch` | Pending | `src/_legacy/molecules/input-switch.tsx` | Final `src/components` version is still missing. |
| `InputJson` | Pending | `src/_legacy/molecules/input-json.tsx` | Public API needs to be defined before migration. |
| `button-form` (loading UX) | Pending (evaluation) | `src/_legacy/atoms/button-form/*` | Decide whether loading belongs in `Button` or a dedicated component. |

### Recommended next cut

1. Migrate `InputSwitch` first (low risk, immediate value for boolean fields).
2. Define and migrate the `form-zod` adapter on top of current `useFormApi`.
3. Resolve `button-form`: add loading support to `Button` or ship `ButtonForm`.
4. Evaluate `InputJson` scope (stay backlog or publish as advanced atom).
