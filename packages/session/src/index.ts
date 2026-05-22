/**
 * @react33/react-session — session strategies for browser SPAs.
 *
 * v0: bearer access + persisted refresh (`createBearerSessionManager`).
 * Apps wire transport (OpenAPI SDK, fetch) in `refresh`; storage via
 * `@react33/react-persistence`; JWT helpers via `@react33/react-helpers`.
 */

export {
  createBearerSessionManager,
  type BearerSessionManager,
  type BearerSessionSelectors,
  type BearerSessionSnapshot,
  type CreateBearerSessionManagerOptions,
} from './bearer-session';

export type { SessionListener, SessionStore } from './session-store';

export {
  createBearerSessionLoad,
  type CreateBearerSessionLoadOptions,
} from './bearer-session-load';

export {
  createBearerSessionRetry,
  type CreateBearerSessionRetryOptions,
} from './createBearerSessionRetry';
