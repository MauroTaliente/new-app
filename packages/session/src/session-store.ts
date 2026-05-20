/**
 * Strategy-agnostic contract that any session manager must satisfy to plug into
 * `createSessionRuntime` (`@react33/react-session/runtime`).
 *
 * Each session strategy in this package (Bearer today; cookie/opaque on the roadmap) defines
 * its own snapshot shape — Bearer's is `BearerSessionSnapshot` (`hasAccess`, `hasRefresh`,
 * `accessPayload`); a future cookie-only strategy would expose something like
 * `{ isAuthenticated, identity }`. The runtime doesn't care which — it only needs to
 * `subscribe` to changes and read the latest `snapshot`.
 *
 * **Design rule**: `getSnapshot()` MUST return a reference-stable object when no field has
 * changed. `useSyncExternalStore` compares snapshots with `Object.is` — returning a fresh
 * literal each call causes infinite re-renders. Manager implementations memoize the snapshot
 * (see `createBearerSessionManager` for the canonical pattern).
 */
export type SessionStore<TSnapshot> = {
  /**
   * Read the current snapshot. Identity is stable across calls when no field changed — pair
   * with `subscribe` to drive `useSyncExternalStore`.
   */
  getSnapshot: () => TSnapshot;
  /**
   * Register a listener fired after every state change. Returns an unsubscribe. Listeners
   * are invoked synchronously, after the snapshot has been updated.
   */
  subscribe: (listener: SessionListener) => () => void;
};

/** Listener signature for `SessionStore.subscribe`. */
export type SessionListener = () => void;
