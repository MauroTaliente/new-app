# CLAUDE.md — new-app

Repo-level instructions for Claude Code agents. Read in addition to package READMEs and
the global `~/.claude/CLAUDE.md`. For deep architecture/taste rules, also load the
`react33-architecture` skill.

---

## File naming — canonical suffix rule

Every file in this repo (handwritten or generated, in packages or apps) follows the same
suffix convention. The rule is mechanical and verifiable; don't bikeshed.

### The suffixes

| Suffix | Meaning |
|---|---|
| `.client.{ts,tsx}` | The file declares `'use client'` (React Server Components boundary). |
| `.server.{ts,tsx}` | The file declares `'server-only'` (or is otherwise non-importable from the client). Reserved — no consumer today. |
| `.generated.{ts,tsx}` | Output of a code generator (theme, i18n, networking, openapi, session). Hand-edits will be lost on next regen. |
| `.runtime.{ts,tsx}` | Orchestrator module that **composes** factories for an app — handwritten (`api.runtime.client.ts`) or generated (`theme.runtime.client.generated.ts`). |

### Combining order

When more than one applies, use this exact order: `<base>.<role?>.<boundary?>.<origin?>.<ext>`

- `<base>` — name (e.g. `api`, `theme`, `pokemon`).
- `<role?>` — domain (e.g. `runtime`, `openapi`). Optional.
- `<boundary?>` — `client` or `server`. Optional.
- `<origin?>` — `generated`. Optional; only when emitted by a code generator.
- `<ext>` — `.ts` if there is no JSX literal in the file; `.tsx` if there is.

### Worked examples

```
api.runtime.client.ts                     # handwritten orchestrator with 'use client'
theme.runtime.client.generated.ts         # generated theme runtime, declares 'use client'
i18n.runtime.client.generated.ts          # generated i18n runtime, declares 'use client'
session.runtime.client.generated.ts       # planned (codegen TBD): generated session runtime
apis.generated.ts                         # generated registry; server-safe, no React
apis.client.generated.tsx                 # generated React hooks for the registry
pokemon.openapi.ts                        # generated SDK; server-safe (just functions)
pokemon.openapi.client.generated.ts       # generated React hooks over the SDK
pokemon.openapi.types.ts                  # generated types — neutral
createThemeRuntime.client.tsx             # in packages/theme: 'use client' boundary, has JSX literal
```

### Rules of thumb when in doubt

- **Has `'use client'` directive?** → add `.client.`
- **Has JSX literal (`<div>`, `<Foo>`)?** → `.tsx`. Else `.ts`. Generics like `Foo<T>` don't count.
- **Emitted by a codegen?** → add `.generated.` right before the extension.
- **Server-safe orchestrator** (e.g. handwritten module re-exporting only neutral pieces) → no `.client`, no `.server`. Just `.runtime.ts`.
- **Naming the file is one decision; declaring `'use client'` is another.** Don't add `.client.` without the directive, and don't ship the directive without renaming.

### What this rule replaces

Historical inconsistencies that are now retired:

- `api.runtime.ts` (no boundary marker, re-exported a React Provider) → `api.runtime.client.ts`.
- `theme.runtime.generated.ts` (declared `'use client'`, no marker) → `theme.runtime.client.generated.ts`.
- `i18n.runtime.generated.tsx` (`.tsx` without JSX) → `i18n.runtime.client.generated.ts`.
- `pokemon.openapi.client.tsx` (`.tsx` without JSX; missing `.generated`) → `pokemon.openapi.client.generated.ts`.

When you migrate a file's name, also update:
1. The codegen `output` / `runtimeModule` / `hooksOutput` / `generatedRuntimeOutput` field
   in `react33.config.json` for any affected app.
2. Every importer (use `grep -rln "<old-stem>"` to find them).
3. The package `tsup` build entries if a package source file moved.

### Verification

After any rename:

```bash
pnpm -F @react33/react-networking -F @react33/react-session -F demo typecheck
pnpm -F @react33/react-networking -F @react33/react-session test
```

Tests + typechecks pass = the rename is complete.

---

## Other agent guidance

- For taste / architectural decisions in `@react33/*`, use the `react33-architecture` skill.
- Memory of past decisions lives in engram — call `mem_search` at the start of any session
  that references prior work.
- Default branch: `main`. Don't commit or push unless asked. End commit messages with
  `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- Verification commands are the source of truth, not "looks fine":

```bash
pnpm -F <package> typecheck
pnpm -F <package> test
```

End each substantial change with both.
