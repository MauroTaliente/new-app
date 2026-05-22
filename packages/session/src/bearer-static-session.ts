import { decodeJwtPayload, isJwtExpired, type JwtPayload } from '@react33/react-helpers';
import {
  createOpaqueTokenPersistence,
  subscribeStorageKey,
  type OpaqueTokenStorage,
} from '@react33/react-persistence';
import type { SessionListener, SessionStore } from './session-store';

/** Selector for the `bearer-static` strategy — only the access token; there is no refresh. */
export type BearerStaticSessionSelectors<TTokens> = {
  selectAccessToken: (tokens: TTokens) => string;
};

/** Where the access token is kept. `bearer-static` has no refresh token, so this governs the credential itself. */
export type BearerStaticStorage = 'memory' | OpaqueTokenStorage;

export type CreateBearerStaticSessionManagerOptions<TTokens> = {
  selectors: BearerStaticSessionSelectors<TTokens>;
  /**
   * Where the access token lives:
   *   - `'memory'` (default) — not persisted; lost on reload. Right when a third-party SDK
   *     (Auth0, Firebase) owns the real session and react33 only caches the current token.
   *   - `'sessionStorage'` — persisted per-tab; survives reload.
   *   - `'localStorage'` — persisted and synced across tabs.
   */
  storage?: BearerStaticStorage;
  /** Storage key for the access token. Required unless `storage` is `'memory'`. */
  storageKey?: string;
  /** Seconds before the JWT `exp` to treat the access token as expired (default 30). */
  accessTokenSkewSec?: number;
};

/**
 * Reactive snapshot of the `bearer-static` manager. No `hasRefresh` — the strategy holds no
 * refresh token. Identity is stable when no field changed (safe for `useSyncExternalStore`).
 */
export type BearerStaticSessionSnapshot = {
  hasAccess: boolean;
  accessPayload: JwtPayload | null;
};

/**
 * `bearer-static` strategy manager — a managed access token with **no refresh**.
 *
 * Sits between `bearer` (access + refresh + `ensureFreshSession`) and `external` (the dev
 * exports a ready `load`): react33 holds and decodes the access token and exposes the
 * `SessionStore` snapshot + a `load`, but there is nothing to refresh. When the token expires
 * the app re-authenticates (a 401 is terminal) — there is no `ensureFreshSession`.
 */
export type BearerStaticSessionManager<TTokens> = SessionStore<BearerStaticSessionSnapshot> & {
  getAccessToken: () => string | null;
  setSession: (tokens: TTokens) => void;
  clearSession: () => void;
  isAccessTokenExpired: (skewSec?: number) => boolean;
  decodeAccessPayload: <T extends JwtPayload = JwtPayload>() => T | null;
  /** Detach the cross-tab subscriber (no-op unless `storage: 'localStorage'`). */
  dispose: () => void;
};

/**
 * Managed bearer access token without a refresh flow. Framework-agnostic (no React).
 *
 * - **No `refresh`/`ensureFreshSession`** — that is what separates it from `createBearerSessionManager`.
 * - **Cross-tab sync** — with `storage: 'localStorage'`, an external change to the token key
 *   updates the in-memory token + payload and emits. No refresh lock is needed (nothing races).
 */
export function createBearerStaticSessionManager<TTokens>(
  options: CreateBearerStaticSessionManagerOptions<TTokens>,
): BearerStaticSessionManager<TTokens> {
  const { selectors, storage = 'memory', storageKey, accessTokenSkewSec = 30 } = options;

  if (storage !== 'memory' && (!storageKey || storageKey.length === 0)) {
    throw new Error(
      '[react-session] bearer-static: storageKey is required when storage is not "memory".',
    );
  }

  const tokenStore =
    storage === 'memory'
      ? null
      : createOpaqueTokenPersistence({ key: storageKey as string, storage });

  let accessToken: string | null = tokenStore ? tokenStore.read() : null;
  let cachedAccessPayload: JwtPayload | null = accessToken ? decodeJwtPayload(accessToken) : null;

  let cachedSnapshot: BearerStaticSessionSnapshot = {
    hasAccess: accessToken !== null,
    accessPayload: cachedAccessPayload,
  };

  const listeners = new Set<SessionListener>();

  /** Recompute the snapshot, returning the cached reference when no field changed. */
  function refreshSnapshot(): BearerStaticSessionSnapshot {
    const hasAccess = accessToken !== null;
    if (
      cachedSnapshot.hasAccess === hasAccess &&
      cachedSnapshot.accessPayload === cachedAccessPayload
    ) {
      return cachedSnapshot;
    }
    cachedSnapshot = { hasAccess, accessPayload: cachedAccessPayload };
    return cachedSnapshot;
  }

  function emit(): void {
    const prev = cachedSnapshot;
    if (refreshSnapshot() === prev) return;
    for (const listener of listeners) listener();
  }

  function setSession(tokens: TTokens): void {
    const access = selectors.selectAccessToken(tokens);
    if (typeof access !== 'string' || access.length === 0) {
      throw new Error(
        '[react-session] bearer-static: selectAccessToken returned an empty value. ' +
          'Ensure your API response shape and selector are aligned, or call clearSession() on logout.',
      );
    }
    accessToken = access;
    cachedAccessPayload = decodeJwtPayload(access);
    tokenStore?.write(access);
    emit();
  }

  function clearSession(): void {
    accessToken = null;
    cachedAccessPayload = null;
    tokenStore?.clear();
    emit();
  }

  function getAccessToken(): string | null {
    return accessToken;
  }

  function isAccessTokenExpired(skewSec = accessTokenSkewSec): boolean {
    return isJwtExpired(accessToken, skewSec);
  }

  function decodeAccessPayload<T extends JwtPayload = JwtPayload>(): T | null {
    return cachedAccessPayload as T | null;
  }

  function getSnapshot(): BearerStaticSessionSnapshot {
    return refreshSnapshot();
  }

  function subscribe(listener: SessionListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  const storageApi =
    storage === 'localStorage' && typeof window !== 'undefined' ? window.localStorage : undefined;

  const unsubscribe =
    storageApi && storageKey
      ? subscribeStorageKey(storageApi, storageKey, (newValue) => {
          accessToken = newValue && newValue.length > 0 ? newValue : null;
          cachedAccessPayload = accessToken ? decodeJwtPayload(accessToken) : null;
          emit();
        })
      : () => {};

  function dispose(): void {
    unsubscribe();
    listeners.clear();
  }

  refreshSnapshot();

  return {
    getAccessToken,
    setSession,
    clearSession,
    isAccessTokenExpired,
    decodeAccessPayload,
    getSnapshot,
    subscribe,
    dispose,
  };
}
