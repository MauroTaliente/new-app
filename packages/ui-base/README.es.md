# @react33/react-ui-base

Primitives agnósticos usados internamente por `@react33/react-form` (InputFrame, Field) y `@react33/react-ui` (inputs concretos, componentes Radix-wrapped).

## Exports

- `Button` — botón/anchor con `variant` (`main` | `outline` | `subtle` | `text` | `link` | `destructive`) y `size` (`xs` | `sm` | `md` | `lg` | familia `icon`)
- `Icon` — resolver de iconos Tabler
- `Overlay` — primitive de loading/overlay basado en motion

Futuros primitives Radix-wrapped (Dialog, Popover, Tooltip, Separator, ScrollArea, Skeleton, Progress, Spinner) van acá para que cualquier paquete superior pueda componerlos.

## Instalación

```bash
pnpm add @react33/react-ui-base @react33/react-styles
```

## Uso

```tsx
import { Button, Icon, Overlay } from '@react33/react-ui-base';

<Button variant="main" size="md">Guardar</Button>
<Icon name="IconCheck" />
<Overlay active={isLoading} variant="loader" />
```

## Cuándo usar este paquete vs `react-form` / `react-ui`

- Solo necesitás los primitives → `react-ui-base`
- Necesitás el framework de form → `react-form` (re-exporta `Button`, `Icon`, `Overlay`)
- Necesitás la librería completa → `react-ui` (re-exporta todo)

## Licencia

MIT
