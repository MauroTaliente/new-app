/**
 * `@react33/react-session/runtime` — opt-in React UI layer for the session manager.
 *
 * Default entry (`@react33/react-session`) stays React-free: manager, bridge, types.
 * This subpath adds the Provider + `useSession`/`useSessionState` hook trio, backed by
 * `useSyncExternalStore` against the manager's `subscribe`/`getSnapshot`.
 */
export {
  createSessionRuntime,
  type CreateSessionRuntimeOptions,
  type SessionProviderProps,
} from './createSessionRuntime.client';
