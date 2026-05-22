/**
 * Un-serializable seam for the `main` session (`react33Session.sessions.main.runtimeModule`).
 *
 * The codegen reads `selectors` + `refresh` from here and emits the rest of the bearer
 * session wiring into `session.runtime.generated.ts`. Framework-agnostic — no React.
 */
import type { BearerSessionSelectors } from '@react33/react-session';

/** Shape of the login / refresh endpoint response. */
export type Tokens = {
  access_token: string;
  refresh_token: string;
};

export const selectors: BearerSessionSelectors<Tokens> = {
  selectAccessToken: (t) => t.access_token,
  selectRefreshToken: (t) => t.refresh_token,
};

/** Stub — replace with the real refresh-endpoint call (OpenAPI SDK, fetch, …). */
export const refresh = async (refreshToken: string): Promise<Tokens | null> => {
  void refreshToken;
  return null;
};
