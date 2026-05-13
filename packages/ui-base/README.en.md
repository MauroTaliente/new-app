# @maurotaliente/react-ui-base

Agnostic UI primitives used internally by `@maurotaliente/react-form` (InputFrame, Field) and `@maurotaliente/react-ui` (concrete inputs, Radix-wrapped components).

## Exports

- `Button` — versatile button/anchor with variant (`main` | `outline` | `subtle` | `text` | `link` | `destructive`) and size (`xs` | `sm` | `md` | `lg` | `icon` family)
- `Icon` — Tabler icon resolver
- `Overlay` — motion-based loading/overlay primitive

Future Radix-wrapped primitives (Dialog, Popover, Tooltip, Separator, ScrollArea, Skeleton, Progress, Spinner) live here so any package higher in the stack can compose them.

## Install

```bash
pnpm add @maurotaliente/react-ui-base @maurotaliente/react-styles
```

## Use

```tsx
import { Button, Icon, Overlay } from '@maurotaliente/react-ui-base';

<Button variant="main" size="md">Save</Button>
<Icon name="IconCheck" />
<Overlay active={isLoading} variant="loader" />
```

## When to use this package vs. `react-form` / `react-ui`

- Need only the primitives → install `react-ui-base`
- Need the form framework → install `react-form` (it re-exports `Button`, `Icon`, `Overlay`)
- Need full component library → install `react-ui` (it re-exports everything)

## License

MIT
