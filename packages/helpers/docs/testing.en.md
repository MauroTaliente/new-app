# Tests in the monorepo

## Location

Tests live in a **`test/`** folder at the package root (next to `src/`), **not** mixed with production code under `src/`.

From tests, import with `../src/<module>.js` (ESM resolution consistent with the rest of the repo).

## File naming: `*.spec.ts`

Use the **`*.spec.ts`** suffix (or **`*.spec.tsx`** if the test file contains JSX).

### `.spec` vs `.test`

| Pattern | Typical use |
|---------|----------------|
| **`*.spec.ts`** | “Specification” style; common in Jest, Angular, Playwright. Signals expected behaviour. |
| **`*.test.ts`** | Also valid; Vitest/Jest pick it up by default. |

**In this monorepo**, packages that document the convention use **`*.spec.ts`** and Vitest is configured with `include: ['test/**/*.spec.ts']` to avoid duplicate patterns and accidental matches.

Vitest accepts **both**; this is a **team style** choice.

## Reference: `@react33/react-hooks`

- Config: `packages/hooks/vitest.config.ts`
- Command: `pnpm --filter @react33/react-hooks test`
