# Performance notes

## Networking model (`useAsyncFetch`)

Each hook instance runs **at most one logical request at a time**. New triggers supersede the previous in-flight work. That keeps ordering predictable and avoids implicit parallel maps.

**When you need parallel requests:** use **multiple hook instances** (different `name` / scope) or compose results with `joinResponses`.

**Shared dedup / short TTL across instances:** use **`requestCache: 'global'`** (or the same custom `RequestCache` instance) and optional **`cacheTtlMs`** on `useAsyncFetch`—see [architecture.en.md](architecture.en.md#opt-in-request-cache-createrequestcache). This is intentionally small (in-memory, keyed by `name`/`params`); it is not a full query graph.

## Bundle size

- Prefer **named imports** from `@maurotaliente/react-helpers` and other packages so bundlers can drop unused code.
- `@maurotaliente/react-networking` pulls in `use-memo-one` and React as peers—size depends on your app’s shared dependencies.
- `@maurotaliente/react-i18n` bundles **`intl-messageformat`** for ICU messages—measure if bundle budget is tight; tree-shake locale data in your app.

## Context and theme

Global theme state lives in React context. Re-renders follow normal React rules: split heavy subtrees or memoize children if profiling shows unnecessary updates.

## Optional: budget tooling

For CI or releases, you can add **`size-limit`** (or similar) on the demo app bundle—this repo does not enforce a budget by default.
