/**
 * @react33/react-session — session strategies for browser SPAs.
 *
 * Strategies:
 *   - `bearer` — access in memory + persisted refresh + `ensureFreshSession` (`createBearerSessionManager`).
 *   - `bearer-static` — managed access token, no refresh (`createBearerStaticSessionManager`).
 *
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

export {
  createBearerStaticSessionManager,
  type BearerStaticSessionManager,
  type BearerStaticSessionSelectors,
  type BearerStaticSessionSnapshot,
  type BearerStaticStorage,
  type CreateBearerStaticSessionManagerOptions,
} from './bearer-static-session';

export type { SessionListener, SessionStore } from './session-store';

export {
  createBearerSessionLoad,
  type CreateBearerSessionLoadOptions,
} from './bearer-session-load';

export {
  createBearerStaticSessionLoad,
  type CreateBearerStaticSessionLoadOptions,
} from './bearer-static-session-load';

export {
  createBearerSessionRetry,
  type CreateBearerSessionRetryOptions,
} from './createBearerSessionRetry';
