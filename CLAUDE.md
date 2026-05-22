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
main.session.runtime.ts                   # handwritten session seam (selectors/refresh, or external load)
theme.runtime.client.generated.ts         # generated theme runtime, declares 'use client'
i18n.runtime.client.generated.ts          # generated i18n runtime, declares 'use client'
session.runtime.generated.ts              # generated session runtime — server-safe (managers + apiRuntime)
session.runtime.client.generated.ts       # generated session runtime — 'use client' (SessionProvider/useSession)
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
1. The codegen `registryOutput` / `runtimeModule` / `hooksOutput` / `runtimeOutput` /
   `stylesOutput` / `typesOutput` field in `react33.config.json` for any affected app.
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

## Config key naming — `react33.config.json`

Every path-like key in `react33.config.json` follows a suffix convention that encodes
**role + kind**. The kind determines the **base of relativity** — that is the whole point:
you never guess what a `./` or `../` resolves against.

### The suffixes

| Suffix | Role | What it is | Resolved relative to |
|---|---|---|---|
| `*Output` | write | a file the codegen generates | `react33.config.json` |
| `*Source` | read | a source file the codegen reads | `react33.config.json` |
| `*Dir` | read | a directory the codegen scans | `react33.config.json` |
| `*Module` | — | a module specifier emitted verbatim into an `import` of a generated file | **the generated file** (no extension) |

Mechanical rule: **ends in `Module` → base is the generated file. Everything else → base
is the config file.** A `*Module` value is a JS module specifier (what you'd write in an
`import`), not a filesystem path — no extension, and `./`/`../` count from wherever the
emitting `*.generated.*` file lives.

### Current keys

```
react33Styles.cssDir              react33Styles.stylesOutput
react33I18n.localesDir            react33I18n.typesOutput / runtimeOutput
react33Theme.runtimeOutput        react33Theme.stylesModule
react33Session.runtimeOutput      react33Session.sessions.*.runtimeModule
react33Networking.registryOutput / hooksOutput      react33Networking.runtimeModule
react33Networking.apis.*.session  (FK — names a react33Session.sessions entry)
react33Networking.openApi.files.*.specSource        .typesOutput / zodOutput / sdkOutput / hooksOutput
react33Networking.openApi.files.*.initData.source
```

### `react33Session` is a collection

`react33Session` holds `{ runtimeOutput, primarySession?, sessions }` — a **map** of named
sessions (mirrors `react33Networking.apis`). Each session is `bearer` (react33-managed) or
`external` (the dev's seam exports a ready `load` — Firebase, Auth0, a token exchange…).

- `react33Session.runtimeOutput` writes the **agnostic** `session.runtime.generated.ts`
  (managers + `apiRuntime`, server-safe). The `'use client'` `session.runtime.client.generated.ts`
  (`SessionProvider`/`useSession` for `primarySession`) is written to a **derived** path —
  no separate key.
- `react33Networking.runtimeModule` must point at the agnostic generated file.
- Codegen order: `react-session-generate` runs **before** `react-networking-generate`.

### Rules of thumb when adding a key

- New file the codegen **writes**? → `*Output`.
- New file the codegen **reads**? → `*Source`. A directory? → `*Dir`.
- A specifier emitted into generated `import`s? → `*Module`, and document it as relative
  to the generated file.
- Never ship a bare `output` / `input` / `path`. The suffix carries the contract.

### What this rule replaces

`fromCss` → `cssDir`, `localesDirectory` → `localesDir`, bare `output` →
`stylesOutput` / `registryOutput`, `generatedTypesOutput` → `typesOutput`,
`generatedRuntimeOutput` → `runtimeOutput`, `stylesGeneratedImport` → `stylesModule`,
openApi `input` → `specSource`, `initData.input` → `initData.source`. v0 — no
backward-compat aliases; the old keys are gone.

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
