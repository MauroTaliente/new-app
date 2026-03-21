# Default theme CSS

Shipped with `@maurotaliente/react-styles` so `react-styles-generate` works without extra arguments.

Edit these files to change library defaults, or pass `--from-css <your-app/src/theme>` to use your app’s CSS as the source of truth.

## Naming → `styles.generated.ts`

- **Theme modes** (`theme.css`): `.light` / `.dark` are the first level under `styles.theme`.
- **Variables** `--{scope}-{rest}`: first segment = scope object; the remainder (hyphens kept) = key, e.g. `--color-bg-100` → `tokens.color['bg-100']`, `--easing-in-out` → `tokens.easing['in-out']`.
- **Single-segment** `--foo` (no extra `-` in the name) → `tokens.other.foo` (same for `palette` / `theme.*`).
- **Meta** in `tokens.css` `@theme`: `--theme-default`, `--theme-cols` → `styles.meta` (not nested in `tokens`).

## `var()` resolution

`react-styles-generate` resolves `var(--*)` to literals **only** using declarations from your three CSS files. Lookup order: for `theme.*`, **mode → tokens → palette** (tokens hold scales like border width / radius / shadow). Unresolved references stay as strings; pure integer literals become `number` in TS.
