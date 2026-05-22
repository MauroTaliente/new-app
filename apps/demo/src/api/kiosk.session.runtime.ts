/**
 * Un-serializable seam for the `kiosk` session — strategy `"bearer-static"`.
 *
 * A bearer-static session is a managed access token with **no refresh**: the codegen reads
 * `selectors` from here and emits the `createBearerStaticSessionManager` wiring. There is no
 * `refresh` — when the token expires the app re-authenticates (a 401 is terminal).
 * Framework-agnostic — no React.
 */
import type { BearerStaticSessionSelectors } from '@react33/react-session';

/** Shape of the token-issuing endpoint response. */
export type KioskTokens = {
  access_token: string;
};

export const selectors: BearerStaticSessionSelectors<KioskTokens> = {
  selectAccessToken: (t) => t.access_token,
};
