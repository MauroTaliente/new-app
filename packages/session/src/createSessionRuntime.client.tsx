'use client';

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { SessionStore } from './session-store';

/**
 * Options for `createSessionRuntime`.
 *
 * `session` is any object that satisfies `SessionStore<TSnapshot>` — today that's the
 * `BearerSessionManager` your runtime module already creates; tomorrow it could be a
 * cookie-only or opaque-session manager. The runtime is strategy-agnostic: it never reads
 * Bearer-specific operations, only `subscribe` + `getSnapshot`.
 */
export type CreateSessionRuntimeOptions<TManager extends SessionStore<unknown>> = {
  session: TManager;
};

export type SessionProviderProps = {
  children: ReactNode;
};

/**
 * Infer the snapshot type a `SessionStore` returns. Lets `useSession()` carry the strategy's
 * exact snapshot shape without the consumer ever writing it explicitly.
 */
type SnapshotOf<TManager> = TManager extends SessionStore<infer S> ? S : never;

/**
 * Build a typed `SessionProvider` + `useSession` / `useSessionState` hook trio backed by
 * `useSyncExternalStore` against any session manager that satisfies `SessionStore<TSnapshot>`.
 *
 * **Bearer call site** (inferred today):
 *
 * ```tsx
 * import { createBearerSessionManager } from '@react33/react-session';
 * import { createSessionRuntime } from '@react33/react-session/runtime';
 *
 * export const session = createBearerSessionManager<MyTokens>({ ... });
 * export const { SessionProvider, useSession, useSessionState } =
 *   createSessionRuntime({ session });
 *
 * // useSession() returns:
 * //   [BearerSessionSnapshot, BearerSessionManager<MyTokens>]
 * ```
 *
 * **Future cookie-only call site** (additive, no breaking change to Bearer):
 *
 * ```tsx
 * const session = createCookieSessionManager({ meEndpoint: '/me' });
 * const { useSession } = createSessionRuntime({ session });
 *
 * // useSession() returns:
 * //   [CookieSessionSnapshot<Profile>, CookieSessionManager<Profile>]
 * ```
 *
 * Both call sites use the same runtime — the consumer never re-imports anything when a new
 * strategy lands. Mirrors the shape of `createThemeRuntime` from `@react33/react-theme`.
 *
 * **Why a Provider when the manager is global?**
 *   - It anchors testability (mount a fake manager via Provider in tests).
 *   - It surfaces typed errors when consumers call `useSession` outside the tree.
 *   - It keeps the API parallel to `useTheme`/`useI18n` so memory transfers between packages.
 */
export function createSessionRuntime<TManager extends SessionStore<unknown>>(
  options: CreateSessionRuntimeOptions<TManager>,
) {
  type TSnapshot = SnapshotOf<TManager>;
  const { session } = options;

  const SessionContext = createContext<TManager | null>(null);
  SessionContext.displayName = 'SessionContext';

  // SSR snapshot: defer to the manager's own initial snapshot. Managers seed their cache
  // at construction (without listeners, so no emit) — calling `getSnapshot()` here is safe
  // and ensures the SSR shape matches the strategy without the runtime hardcoding fields.
  const SERVER_SNAPSHOT = session.getSnapshot() as TSnapshot;
  const getServerSnapshot = () => SERVER_SNAPSHOT;

  function SessionProvider({ children }: SessionProviderProps) {
    return (
      <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
    );
  }

  /**
   * Reactive snapshot of the session. Re-renders the caller whenever the underlying manager
   * emits (login, logout, cross-tab clear, refresh completion — whatever the strategy defines).
   */
  function useSessionState(): TSnapshot {
    const ctx = useContext(SessionContext);
    if (!ctx) {
      throw new Error(
        '[react-session] useSessionState must be used within a <SessionProvider>',
      );
    }
    return useSyncExternalStore(
      ctx.subscribe,
      ctx.getSnapshot as () => TSnapshot,
      getServerSnapshot,
    );
  }

  /**
   * Reactive snapshot + manager handle, returned as a tuple — parallels `useTheme()` shape
   * (`[state, updater]`). Use the manager handle for imperative actions (the operations the
   * strategy exposes — `setSession`/`clearSession`/`ensureFreshSession` for Bearer, etc.).
   */
  function useSession(): readonly [TSnapshot, TManager] {
    const ctx = useContext(SessionContext);
    if (!ctx) {
      throw new Error(
        '[react-session] useSession must be used within a <SessionProvider>',
      );
    }
    const snap = useSyncExternalStore(
      ctx.subscribe,
      ctx.getSnapshot as () => TSnapshot,
      getServerSnapshot,
    );
    return [snap, ctx] as const;
  }

  return {
    SessionProvider,
    useSession,
    useSessionState,
    /** Same reference as the `session` passed in — convenience for re-export. */
    session,
  } as const;
}
