import { decodeJwtPayload, isJwtExpired, type JwtPayload } from '@react33/react-helpers';
import {
  createOpaqueTokenPersistence,
  subscribeStorageKey,
  type OpaqueTokenStorage,
} from '@react33/react-persistence';
import type { SessionListener, SessionStore } from './session-store';

export type BearerSessionSelectors<TTokens> = {
  selectAccessToken: (tokens: TTokens) => string;
  selectRefreshToken: (tokens: TTokens) => string;
};

export type CreateBearerSessionManagerOptions<TTokens> = {
  /** sessionStorage/localStorage key for the refresh token string. */
  storageKey: string;
  storage?: OpaqueTokenStorage;
  selectors: BearerSessionSelectors<TTokens>;
  /**
   * App-provided refresh implementation (OpenAPI SDK, raw `fetch`, etc.).
   *
   * Two ways to signal failure — both clear the session:
   *   - **Resolve to `null`** — preferred when your transport returns a typed error.
   *   - **Throw / reject** — the manager catches it, calls `clearSession()`, and resolves
   *     `ensureFreshSession()` to `false`. You don't need to wrap your SDK call in try/catch.
   *
   * On success: return the new `TTokens` shape; the manager runs your `selectors` against it
   * and stores access (in memory) + refresh (in storage). Note: if a selector throws (e.g.
   * `selectRefreshToken` rejects an empty string), the error is treated as a refresh failure
   * — the session is cleared and `ensureFreshSession()` resolves `false`. So misconfigured
   * selectors look like a logout, not a thrown error. Verify your selectors against your
   * actual response shape before publishing.
   */
  refresh: (refreshToken: string) => Promise<TTokens | null>;
  /** Seconds before JWT `exp` to treat access as expired (default 30). */
  accessTokenSkewSec?: number;
};

/**
 * Reactive snapshot of the manager's state. Returned by `getSnapshot()` and re-emitted whenever
 * `setSession`/`clearSession`/cross-tab sync mutate the underlying tokens.
 *
 * Identity is **stable** when no field changed — the manager returns the cached reference, so
 * this is safe to use directly with `useSyncExternalStore` (which compares snapshots by `Object.is`).
 *
 * Cast `accessPayload` to your app's JWT shape at the call site if you need typed claims, the
 * same way `decodeAccessPayload<T>()` does.
 */
export type BearerSessionSnapshot = {
  /** `true` when an access token is held in memory (regardless of expiration). */
  hasAccess: boolean;
  /** `true` when a refresh token is persisted (in `sessionStorage`/`localStorage`). */
  hasRefresh: boolean;
  /** Decoded JWT payload of the current access token, or `null` if no access is held. */
  accessPayload: JwtPayload | null;
};

/**
 * Bearer-strategy manager.
 *
 * Satisfies the strategy-agnostic `SessionStore<BearerSessionSnapshot>` contract via
 * `subscribe` + `getSnapshot`, plus Bearer-specific operations (`setSession`,
 * `ensureFreshSession`, etc.). Other strategies (cookie, opaque) define their own
 * snapshot shape and operations but share the same `SessionStore` contract — that's
 * what lets a single `createSessionRuntime` host any of them without breaking changes.
 */
export type BearerSessionManager<TTokens> = SessionStore<BearerSessionSnapshot> & {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setSession: (tokens: TTokens) => void;
  clearSession: () => void;
  hasRefreshToken: () => boolean;
  isAccessTokenExpired: (skewSec?: number) => boolean;
  decodeAccessPayload: <T extends JwtPayload = JwtPayload>() => T | null;
  ensureFreshSession: () => Promise<boolean>;
  /**
   * Detach the cross-tab storage subscriber. Optional — long-lived managers can ignore.
   * Call from tests, transient components, or when replacing the manager instance.
   *
   * `getSnapshot` + `subscribe` are inherited from `SessionStore<BearerSessionSnapshot>`.
   * The snapshot is memoized — identity stays stable when nothing changed (required by
   * `useSyncExternalStore`).
   */
  dispose: () => void;
};

/**
 * Bearer access + persisted refresh token + coalesced refresh.
 *
 * - **Access token in memory** — not persisted by default; survives only within the tab session.
 * - **Refresh token in storage** — `sessionStorage` (per-tab) or `localStorage` (cross-tab).
 * - **Single-flight refresh** — concurrent `ensureFreshSession()` calls coalesce into one,
 *   in-tab (`inFlightRefresh`) and cross-tab (Web Locks). Safe with single-use rotating
 *   refresh tokens: only one tab ever spends a given refresh token.
 * - **Cross-tab sync** — when `storage: 'localStorage'`, external changes to the refresh key
 *   (clear or update from another tab) invalidate the in-memory access + payload cache. Next
 *   request triggers `ensureFreshSession()` with the new refresh value. With `sessionStorage`
 *   this is a no-op by browser design (sessionStorage is per-tab).
 * - **Observable** — `subscribe(listener)` + `getSnapshot()` let UI layers (the optional
 *   `createSessionRuntime` runtime) react to login/logout/cross-tab events without polling.
 *
 * Framework-agnostic (no React in this file). Future session strategies (cookie-only, opaque
 * session id, etc.) live alongside this module as separate factories — see the package README.
 */
export function createBearerSessionManager<TTokens>(
  options: CreateBearerSessionManagerOptions<TTokens>,
): BearerSessionManager<TTokens> {
  const {
    storageKey,
    storage = 'sessionStorage',
    selectors,
    refresh,
    accessTokenSkewSec = 30,
  } = options;

  const tokenStore = createOpaqueTokenPersistence({ key: storageKey, storage });

  let accessToken: string | null = null;
  let cachedAccessPayload: JwtPayload | null = null;
  let refreshTokenMemory: string | null = null;
  let inFlightRefresh: Promise<boolean> | null = null;

  // Snapshot cache for stable identity. Recomputed only when an underlying field changed.
  let cachedSnapshot: BearerSessionSnapshot = {
    hasAccess: false,
    hasRefresh: false,
    accessPayload: null,
  };

  const listeners = new Set<SessionListener>();

  /**
   * Recompute the snapshot from current state. Returns the **cached** reference if every field
   * is `===` to the previous one — required by `useSyncExternalStore`, which would otherwise
   * tear or re-render on every read.
   */
  function refreshSnapshot(): BearerSessionSnapshot {
    const hasAccess = accessToken !== null;
    const hasRefresh = refreshTokenMemory !== null && refreshTokenMemory.length > 0;
    const accessPayload = cachedAccessPayload;
    if (
      cachedSnapshot.hasAccess === hasAccess &&
      cachedSnapshot.hasRefresh === hasRefresh &&
      cachedSnapshot.accessPayload === accessPayload
    ) {
      return cachedSnapshot;
    }
    cachedSnapshot = { hasAccess, hasRefresh, accessPayload };
    return cachedSnapshot;
  }

  function emit(): void {
    const prev = cachedSnapshot;
    const next = refreshSnapshot();
    if (next === prev) return; // No observable change, no-op.
    for (const listener of listeners) listener();
  }

  /** Internal: load refresh from storage lazily on first read. */
  function hydrateRefreshToken(): void {
    if (refreshTokenMemory) return;
    refreshTokenMemory = tokenStore.read();
  }

  function setSession(tokens: TTokens): void {
    const access = selectors.selectAccessToken(tokens);
    const rt = selectors.selectRefreshToken(tokens);
    if (typeof rt !== 'string' || rt.length === 0) {
      throw new Error(
        '[react-session] selectRefreshToken returned an empty value. ' +
          'Ensure your API response shape and selector are aligned, or call clearSession() on logout.',
      );
    }
    accessToken = access;
    cachedAccessPayload = decodeJwtPayload(access);
    refreshTokenMemory = rt;
    tokenStore.write(rt);
    emit();
  }

  function clearSession(): void {
    accessToken = null;
    cachedAccessPayload = null;
    refreshTokenMemory = null;
    tokenStore.clear();
    emit();
  }

  function getAccessToken(): string | null {
    return accessToken;
  }

  function getRefreshToken(): string | null {
    hydrateRefreshToken();
    return refreshTokenMemory;
  }

  function hasRefreshToken(): boolean {
    hydrateRefreshToken();
    return Boolean(refreshTokenMemory);
  }

  function isAccessTokenExpired(skewSec = accessTokenSkewSec): boolean {
    return isJwtExpired(accessToken, skewSec);
  }

  function decodeAccessPayload<T extends JwtPayload = JwtPayload>(): T | null {
    return cachedAccessPayload as T | null;
  }

  /**
   * The token refresh itself — run while the cross-tab lock is held (see `runRefreshExclusive`).
   *
   * Re-reads the refresh token from storage first: while this call waited for the lock, another
   * tab may have rotated it (single-use refresh tokens) and written the new value. Refreshing
   * with the stale in-memory token would fail against a rotating backend — re-reading avoids
   * that spurious failure and the cross-tab logout cascade it would trigger. A `null` read means
   * storage was cleared meanwhile (another tab logged out) — treat it as a terminal logout.
   */
  async function performRefresh(): Promise<boolean> {
    const token = tokenStore.read();
    if (!token) {
      clearSession();
      return false;
    }
    refreshTokenMemory = token;
    try {
      const next = await refresh(token);
      if (!next) {
        clearSession();
        return false;
      }
      setSession(next);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }

  /**
   * Run `performRefresh` under a cross-tab lock so only one tab refreshes at a time.
   *
   * With single-use rotating refresh tokens + `localStorage`, two tabs refreshing concurrently
   * race the same token: one wins, the loser's request is rejected and clears the session — and
   * that storage clear cascades the logout back to the winner. The Web Locks API serialises the
   * refresh across tabs (the cross-tab counterpart of the in-tab `inFlightRefresh` guard). The
   * lock name is scoped to `storageKey` so distinct sessions never block each other. Falls back
   * to a direct call when the API is unavailable (older browsers, SSR).
   */
  async function runRefreshExclusive(): Promise<boolean> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks) return performRefresh();
    return await locks.request(`react33.session.refresh:${storageKey}`, () => performRefresh());
  }

  function ensureFreshSession(): Promise<boolean> {
    if (inFlightRefresh) return inFlightRefresh;
    hydrateRefreshToken();
    if (!refreshTokenMemory) return Promise.resolve(false);

    inFlightRefresh = runRefreshExclusive().finally(() => {
      inFlightRefresh = null;
    });
    return inFlightRefresh;
  }

  function getSnapshot(): BearerSessionSnapshot {
    return refreshSnapshot();
  }

  function subscribe(listener: SessionListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Cross-tab reaction: any external change to the refresh-token storage key invalidates
   * in-memory access + cached payload. The refresh memory is updated to reflect the storage
   * value so the next `ensureFreshSession()` uses the latest refresh (or no-ops if cleared).
   */
  const storageApi =
    typeof window !== 'undefined'
      ? storage === 'localStorage'
        ? window.localStorage
        : window.sessionStorage
      : undefined;

  const unsubscribe = storageApi
    ? subscribeStorageKey(storageApi, storageKey, (newValue) => {
        accessToken = null;
        cachedAccessPayload = null;
        refreshTokenMemory = newValue && newValue.length > 0 ? newValue : null;
        emit();
      })
    : () => {};

  function dispose(): void {
    unsubscribe();
    listeners.clear();
  }

  // Seed snapshot from initial state (no listeners yet, so no emit needed).
  refreshSnapshot();

  return {
    getAccessToken,
    getRefreshToken,
    setSession,
    clearSession,
    hasRefreshToken,
    isAccessTokenExpired,
    decodeAccessPayload,
    ensureFreshSession,
    getSnapshot,
    subscribe,
    dispose,
  };
}
