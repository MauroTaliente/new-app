# @react33/react-session

Session **strategies** for browser apps — separate from any one API contract.

## v0: Bearer + refresh

`createBearerSessionManager` provides:

- Access token in **memory** (not persisted by default)
- Refresh token via `@react33/react-persistence` (`createOpaqueTokenPersistence`)
- **Single-flight** `ensureFreshSession()`
- JWT decode via `@react33/react-helpers` (`decodeAccessPayload`, `isAccessTokenExpired`)

Wire transport in `refresh` (OpenAPI SDK, `fetch`, etc.). No React required — use from route loaders and HTTP `load` hooks.

```ts
import { createBearerSessionManager } from '@react33/react-session';

export const session = createBearerSessionManager({
  storageKey: 'app.session',
  selectors: {
    selectAccessToken: (t) => t.access_token,
    selectRefreshToken: (t) => t.refresh_token,
  },
  refresh: async (refreshToken) => {
    const res = await mySdk.refresh({ refresh_token: refreshToken });
    return res.ok ? res.data : null;
  },
});
```

## Codegen — the `react33Session` collection (recommended)

`react33Session` in `react33.config.json` is a **collection** of named sessions — one app can
hold several, each authenticating different APIs with its own token. `react-session-generate`
turns it into two modules; you only hand-write the un-serializable **seam** per session.

```json
{
  "react33Session": {
    "runtimeOutput": "./src/api/session.runtime.generated.ts",
    "primarySession": "main",
    "sessions": {
      "main":    { "strategy": "bearer",   "runtimeModule": "./main.session.runtime",
                   "bearer": { "storageKey": "app.session", "storage": "localStorage" },
                   "retry":  { "statuses": { "401": 1 }, "tokenExpiredCode": "TOKEN_EXPIRED" } },
      "partner": { "strategy": "external", "runtimeModule": "./partner.session.runtime" }
    }
  },
  "react33Networking": {
    "registryOutput": "./src/api/apis.generated.ts",
    "runtimeModule": "./session.runtime.generated",
    "apis": {
      "billing": { "url": "https://billing.example.com", "session": "main" },
      "reports": { "url": "https://reports.example.com",  "session": "partner" }
    }
  }
}
```

**`apis.<name>.session`** is the foreign key — it binds an API to a session by name. An API
with no `session` gets no auth. Many APIs may share one session.

### Two generated files (the server/client split)

| File | `'use client'`? | Contains | Imported by |
|---|---|---|---|
| `session.runtime.generated.ts` | no — server-safe | the session managers + `apiRuntime` (`loads`, `defaultsByApi`) | `apis.generated.ts` (`react33Networking.runtimeModule` → here) |
| `session.runtime.client.generated.ts` | yes | `SessionProvider` + `useSession`/`useSessionState` for `primarySession` | your React tree |

One `runtimeOutput` key names the agnostic file; the `.client` path is **derived**. The split
keeps the React boundary out of the server-safe networking seam.

### The seam — `bearer` vs `external`

Each session's `runtimeModule` is a hand-written file. What it must export depends on `strategy`:

- **`bearer`** — `selectors: BearerSessionSelectors<Tokens>` + `refresh`. The codegen builds the
  `createBearerSessionManager` + `createBearerSessionLoad` wiring.
- **`external`** — `load: LoadRequestProps` (always) and `sessionStore?: SessionStore` (only when
  this session is the `primarySession`). The codegen wires the `load` straight into
  `apiRuntime.loads` and constructs **no** react33 manager. This is the escape hatch for
  third-party auth — Firebase, Auth0, Supabase, NextAuth, a token-exchange endpoint:

  ```ts
  // partner.session.runtime.ts — strategy: "external"
  import { mergeRequestProps, type LoadRequestProps } from '@react33/react-networking';
  export const load: LoadRequestProps = async (shared) =>
    mergeRequestProps(shared, {
      headers: { Authorization: `Bearer ${await getAuth().currentUser?.getIdToken()}` },
    });
  ```

  react33 never authenticates — it **wires auth into networking**. With `external`, the manager,
  storage, and single-flight refresh go unused; the third-party SDK owns that lifecycle.

### Per-API retry — `defaultsByApi`

A session's optional `retry` block is emitted **per-API** into `apiRuntime.defaultsByApi` via
`createBearerSessionRetry`, so a 401 from one API refreshes only **that** session's token. With
`tokenExpiredCode` set, a 401 whose body code differs (or is absent) is terminal — no refresh.
Codegen order: `react-session-generate` runs before `react-networking-generate`.

## Wiring — handwritten (no codegen)

Prefer the `react33Session` codegen above. The two paths below are for apps that compose the
runtime module or the registry by hand — the same primitives, wired manually.

### Path A — handwritten runtime module

If your app drives the API registry from `react33.config.json` (`react33Networking.apis`), expose a **runtime module** that owns session creation + the `ApiRuntime` export. The generator wires the rest.

`react33.config.json`:

```json
{
  "react33Networking": {
    "registryOutput": "./src/api/apis.generated.ts",
    "runtimeModule": "./api.runtime",
    "apis": { "main": { "url": "https://api.example.com" } }
  }
}
```

`src/api/api.runtime.ts`:

```ts
import type { ApiRuntime } from '@react33/react-networking';
import {
  createBearerSessionManager,
  createBearerSessionLoad,
} from '@react33/react-session';

export const session = createBearerSessionManager<MyTokens>({
  storageKey: 'app.session',
  storage: 'localStorage',
  selectors: {
    selectAccessToken: (t) => t.access_token,
    selectRefreshToken: (t) => t.refresh_token,
  },
  refresh: async (rt) =>
    (await mySdk.refresh({ refresh_token: rt })).data ?? null,
});

export const apiRuntime: ApiRuntime = {
  defineDefinitions: (base) => base, // or runtime base-URL overrides
  load: createBearerSessionLoad(session),
  defaults: {
    retries: { 401: 1 },
    onRetry: async ({ status }) => {
      if (status === 401) await session.ensureFreshSession();
    },
  },
};
```

Generated `apis.generated.ts` picks up `apiRuntime` and wires `createApiRegistry` automatically. **Nothing else changes** when you swap strategies, add a 401 reaction, or change base URLs per env — just edit `api.runtime.ts`.

### Path B — handwritten `createApiRegistry`

If you compose the registry by hand (no codegen):

```ts
import { createApiRegistry } from '@react33/react-networking';
import {
  createBearerSessionManager,
  createBearerSessionLoad,
} from '@react33/react-session';
import { definitions } from './apis.generated';

export const session = createBearerSessionManager<MyTokens>({ /* ... */ });

export const apis = createApiRegistry(definitions, {
  load: createBearerSessionLoad(session),
  defaults: {
    retries: { 401: 1 },
    onRetry: async ({ status }) => {
      if (status === 401) await session.ensureFreshSession();
    },
  },
});
```

Same behavior; choose the path that matches your codegen setup.

The `load` re-runs **before each retry** (see `@react33/react-networking`), so the refreshed access token reaches the retried request automatically.

### Why `proactiveRefresh` + reactive `onRetry` is safe to combine

Both hooks call `session.ensureFreshSession()`, so a naive reading suggests a double refresh per request when the access token is expired. It isn't: the manager runs **single-flight** — concurrent callers of `ensureFreshSession()` (the proactive pre-flight, the reactive `onRetry` after a 401, even parallel requests on the same tab) share the **same in-flight promise**. Only one network refresh runs; everyone else awaits its result.

This is what makes the recommended combo robust without coordination at the app level:

- **Proactive (`createBearerSessionLoad` with `proactiveRefresh: true`)** handles the *common* case — your access token is expired before the request leaves the tab. The refresh is paid once, off the critical path of the retry.
- **Reactive (`onRetry` on 401)** handles the *race* — token was valid when the request shipped but revoked or expired between send and response. Single-flight guarantees the proactive path's promise (if any was started in parallel) is reused.

If you want pure reactive (no pre-flight check, refresh only on 401), pass `proactiveRefresh: false` to `createBearerSessionLoad` — see "Custom header templates" below.

The `onRetry` callback receives the full retry context, including the failed response:

```ts
onRetry: async ({ status, response, attempt }) => {
  if (status === 401 && response?.data?.code === 'TOKEN_EXPIRED') {
    await session.ensureFreshSession();
  }
  if (status === 429) {
    const after = response?.headers?.get('Retry-After');
    // ... custom backoff using `after` ...
  }
},
```

### Custom header templates

Override `headers` for non-bearer schemes:

```ts
createBearerSessionLoad(session, {
  headers: { 'X-Api-Key': '{token}' },
});
```

Pass `proactiveRefresh: false` to disable the pre-flight refresh check (e.g. when you want refresh to happen only via `onRetry`):

```ts
createBearerSessionLoad(session, { proactiveRefresh: false });
```

## Storage choice — security trade-off

The `storage` option (`'sessionStorage'` default, `'localStorage'` opt-in) controls where the **refresh token** is persisted. The access token is always in memory.

| Storage | Lifetime | Cross-tab | XSS exposure |
|---|---|---|---|
| `sessionStorage` (default) | Until tab closes | ❌ per-tab | Same-origin scripts in the tab can read |
| `localStorage` | Until cleared | ✅ shared | Same-origin scripts in ANY tab can read; persists across tab closes |

**Both are JS-readable** by same-origin scripts, so XSS that injects script into your origin can exfiltrate the refresh token regardless of choice. The differences:

- `sessionStorage` limits the **time window** of exposure (closes when the tab closes) and **does not** persist across sessions or share across tabs.
- `localStorage` enables cross-tab UX (login in one tab updates all) but the token survives until you call `clearSession()` or the user clears storage.

For maximum reduction of XSS exposure, use an **HttpOnly cookie** refresh strategy at the backend (planned in roadmap). The current `sessionStorage` default is a pragmatic middle ground for SPAs.

## UI reactivity with `createSessionRuntime`

The core manager is framework-agnostic — no React, no observables — but it ships a tiny
`subscribe(listener)` + `getSnapshot()` pair (the same primitives `useSyncExternalStore`
needs). The optional **subpath** `@react33/react-session/runtime` builds a typed
`SessionProvider` + `useSession` / `useSessionState` hook trio on top, parallel to
`createThemeRuntime` from `@react33/react-theme`.

Wire it in your runtime module, next to the manager:

```ts
// src/api/api.runtime.ts
import {
  createBearerSessionManager,
  createBearerSessionLoad,
} from '@react33/react-session';
import { createSessionRuntime } from '@react33/react-session/runtime';
import type { ApiRuntime } from '@react33/react-networking';

export const session = createBearerSessionManager<MyTokens>({ /* ... */ });

export const apiRuntime: ApiRuntime = {
  defineDefinitions: (base) => base,
  load: createBearerSessionLoad(session),
  defaults: { /* ... */ },
};

// UI layer — same `session` reference, now observable.
export const { SessionProvider, useSession, useSessionState } =
  createSessionRuntime({ session });
```

Mount the Provider once near the root:

```tsx
// src/app/Providers.tsx
'use client';
import { SessionProvider } from '@/api/api.runtime';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Read the snapshot anywhere underneath:

```tsx
'use client';
import { useSession } from '@/api/api.runtime';

export function Header() {
  const [{ hasAccess, accessPayload }, session] = useSession();
  return hasAccess
    ? <button onClick={session.clearSession}>Logout {accessPayload?.sub}</button>
    : <a href="/login">Sign in</a>;
}
```

**What's reactive** — `hasAccess`, `hasRefresh`, `accessPayload` re-render on login,
logout, cross-tab clear, and refresh completion. The snapshot is reference-stable when
nothing changes (the manager memoizes it), so `useSyncExternalStore` won't tear or
re-render needlessly.

**Why a Provider when the manager is global?** It anchors testability (mount a fake
manager via Provider in tests), surfaces typed errors when consumers forget to wrap
the tree, and keeps the API parallel to `useTheme`/`useI18n` — memory transfers across
packages.

**Typed payload** — both hooks accept a JWT payload generic at the call site, the same
way `manager.decodeAccessPayload<T>()` does:

```tsx
type MyClaims = { sub: string; roles: string[] };
const [{ accessPayload }] = useSession<MyClaims>();
accessPayload?.roles; // typed
```

The subpath only loads when you import it — apps that use just the manager + bridge
stay React-free.

## Strategies side by side — where each piece of data lives

A consistent question while reading this README: *"why does Bearer hold an `accessPayload`
right there in the snapshot, but cookie-only sessions need to hit `/me`?"* The split is
strategy-by-strategy, not framework-by-framework. The runtime in front of them is the
same — what changes is **where the authoritative data lives** and **what work the
strategy is willing to do in the browser**.

### Storage matrix

| Concern | Bearer (today) | Cookie + `/me` (planned) | Opaque session id (planned) |
|---|---|---|---|
| **Auth credential** | Refresh token in `sessionStorage` (default) or `localStorage` | HttpOnly cookie, owned by the browser — JS cannot read or write it | Single opaque token in storage **or** cookie |
| **Access expiration check** | JWT `exp` decoded locally → proactive refresh possible | Unknown to the client — strictly **reactive** (401 → bootstrap) | Unknown to the client — strictly reactive |
| **User data (name, roles, …)** | **Decoded from the access JWT** (`accessPayload.sub`, `.roles`, …) — zero network reads | **Fetched from `/me`**, optionally cached in `localStorage` for UX | **Fetched from `/me`** as well |
| **Login flow** | `POST /login` → server returns `{ access, refresh }` → `setSession(tokens)` | `POST /login` (credentials: include) → server sets cookie → app calls `bootstrap()` to hydrate identity from `/me` | Same as cookie, or token returned in body |
| **Refresh** | Client-orchestrated: `ensureFreshSession()` calls your `refresh` SDK | Server-orchestrated (cookie rotation). Client is purely reactive | Same as cookie |
| **Logout** | `clearSession()` wipes memory + storage | `POST /logout` (server invalidates cookie) → `clear()` resets local cache | `POST /logout` → `clear()` |
| **Bridge (`load`)** | `createBearerSessionLoad(session)` → injects `Authorization: Bearer {token}` header (templates supported) | `createCookieSessionLoad(session)` → sets `credentials: 'include'`, no header injection | Sets `Authorization` header **or** `credentials: 'include'`, depending on transport |
| **Snapshot shape** (read via `useSession`) | `{ hasAccess, hasRefresh, accessPayload }` | `{ isAuthenticated, identity }` | `{ isAuthenticated, identity }` |

`sessionStorage` and `localStorage` don't disappear with cookie-only strategies — they
just take a different role: for Bearer they hold the refresh token (the credential),
for cookie/opaque they're an **optional UX cache** for the last `/me` profile so the
UI doesn't flash a skeleton on every navigation. The server stays source of truth
either way; the cache is just a hint.

### What's strategy-exclusive — and why none of it is in the runtime

Three things only Bearer can do, all because they depend on holding a JWT in memory:

- **Skew check** (`isAccessTokenExpired(skewSec)`). "Token expires in 30s, refresh now"
  is only possible when the client sees the `exp` claim. Cookie-only sessions can't —
  the cookie is HttpOnly, the browser owns its lifetime. Proactive refresh is a Bearer
  feature; cookie sessions refresh reactively (401 → bootstrap).
- **Claim decoding without network**. Reading `accessPayload.roles` is one decode call
  in Bearer, one `/me` round-trip in cookie/opaque.
- **`createBearerSessionLoad`**. Sets the `Authorization: Bearer {token}` header.
  Cookie strategies need their own bridge that flips `credentials: 'include'` instead.

None of these are wired into `createSessionRuntime`. They all live in
`createBearerSessionManager` and `createBearerSessionLoad`. The runtime only reads
`subscribe` + `getSnapshot` from any `SessionStore<TSnapshot>` — that's the entire
contract. When cookie-session lands, its snapshot shape is its choice; the runtime
infers it through generics and `useSession()` carries the right tuple to the call site.

### What happens to your UI code the day cookie-session ships

A component reading the session today:

```tsx
const [{ hasAccess, accessPayload }] = useSession<MyJwtClaims>();
hasAccess && <span>Hello {accessPayload?.name}</span>;
```

The same component on cookie-session:

```tsx
const [{ isAuthenticated, identity }] = useSession<MyProfile>();
isAuthenticated && <span>Hello {identity?.name}</span>;
```

Same import path (`useSession` from your `api.runtime.ts`), same hook, same Provider.
Only the snapshot field names change because they reflect the strategy's worldview.
That's the postponement we can afford because the runtime is `SessionStore`-shaped, not
`BearerSessionManager`-shaped.

### Where the `/me` round-trip lives in the cookie strategy (preview)

For Bearer, the network call is the **refresh** (`ensureFreshSession`). For cookie/opaque,
it's a **bootstrap** that hydrates identity:

```ts
// Sketch — not shipped yet.
const session = createCookieSessionManager({
  meEndpoint: '/me',
  selectors: { selectIdentity: (res) => res.user },
  cache: { storage: 'localStorage', key: 'app.profile' }, // optional UX cache
});

// At app start, after login UI, or on cross-tab login event:
await session.bootstrap();  // GET /me; on 200 -> emit; on 401 -> stay anonymous

// In your apiRuntime:
defaults: {
  retries: { 401: 1 },
  onRetry: async ({ status }) => {
    if (status === 401) await session.bootstrap();
  },
}
```

Note how `defaults.retries` + `onRetry` is identical between Bearer and cookie — the
strategy decides what `ensureFreshSession` vs `bootstrap` does, but the registry-wide
retry policy looks the same. That's the part of the design that makes "swap the
strategy" a one-file change in `api.runtime.ts`, not a cross-cutting refactor.

## Cross-tab sync (`localStorage` only)

When `storage: 'localStorage'`, the manager subscribes to `storage` events for its refresh-token key. If **another tab** clears or updates that key, this tab invalidates its in-memory access + decoded payload and updates its refresh-token reference. The next request that triggers `ensureFreshSession()` uses the new refresh value (or no-ops if cleared).

With `storage: 'sessionStorage'` (default), this is a no-op by browser design: `sessionStorage` is per-tab.

### Cross-tab refresh lock (rotating refresh tokens)

`ensureFreshSession()` runs the refresh under a **cross-tab lock** (the [Web Locks API](https://developer.mozilla.org/docs/Web/API/Web_Locks_API)) — the cross-tab counterpart of the in-tab single-flight guard. The lock name is scoped to `storageKey`, so distinct sessions never block each other.

This matters when the backend issues **single-use rotating refresh tokens** (OAuth 2.0 BCP): without the lock, two tabs whose access tokens expire together both refresh with the *same* token — one wins, the other's request is rejected and clears the session, and that storage clear cascades the logout back to the winning tab. With the lock, only one tab refreshes at a time; each waiting tab then **re-reads the refresh token from storage**, so it spends the freshly rotated token, not the stale one. No spurious logout, no cascade.

When `navigator.locks` is unavailable (older browsers, SSR), it degrades gracefully to the in-tab guard.

## Lifecycle: `dispose()`

The manager returns a `dispose()` method that detaches the cross-tab subscriber. Long-lived managers (one per app) can ignore it. Tests, transient components, or code that replaces the manager instance should call it.

```ts
const session = createBearerSessionManager(/* ... */);
// ... later, on teardown:
session.dispose();
```

## Adding new session strategies

Each strategy lives as a **pair** of files inside `src/`:

```
src/
├── <strategy>-session.ts        # create<Strategy>SessionManager(options)
├── <strategy>-session-load.ts   # create<Strategy>SessionLoad(manager, options?)
```

Conventions:

- **Manager factory**: `create<Strategy>SessionManager(options)` — strategy-specific options, returns the manager (plain object of functions).
- **Bridge factory**: `create<Strategy>SessionLoad(manager, options?)` — returns a `LoadRequestProps` from `@react33/react-networking`.
- **Each strategy is self-contained** — no shared `SessionManager` interface enforced. When 2-3 strategies expose the same operation, factor the common shape; until then, don't anticipate.
- **Tests live alongside**: `test/<strategy>-session.spec.ts` + `test/<strategy>-session-load.spec.ts`.
- **No React in the default entry** — manager + bridge are framework-agnostic. React glue lives behind the `./runtime` subpath (`@react33/react-session/runtime`), opt-in.

Future strategies under consideration (roadmap):

- **HttpOnly cookie session** — no JS-readable token; relies on backend cookie endpoints. Bridge attaches no header; relies on `credentials: 'include'`.
- **Opaque server session id** — single token, server-side session state, no JWT decode.
- ~~**React `SessionProvider`**~~ — shipped: see `createSessionRuntime` above (`@react33/react-session/runtime`).

## Out of scope by design

- **Response interceptors / 401 reaction beyond `onRetry`** — use `onRetry` from `@react33/react-networking` at the app level.
- **A shared `SessionManager` interface** — premature abstraction; will emerge once multiple strategies coexist.
