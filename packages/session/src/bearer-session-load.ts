import type { LoadRequestProps, RequestProps } from '@react33/react-networking';
import { mergeRequestProps } from '@react33/react-networking';
import type { BearerSessionManager } from './bearer-session';

/**
 * Default header template — overridable. The literal `{token}` is replaced by the access token.
 */
const DEFAULT_HEADERS: Readonly<Record<string, string>> = {
  Authorization: 'Bearer {token}',
};

export type CreateBearerSessionLoadOptions = {
  /**
   * Headers to merge into each request. Any occurrence of `{token}` in a header value
   * is replaced by the current access token before the request is sent.
   * Defaults to `{ Authorization: 'Bearer {token}' }`.
   */
  headers?: Record<string, string>;
  /**
   * When `true` (default), call `session.ensureFreshSession()` if the access token is
   * expired AND a refresh token is available, before attaching the header. The manager's
   * single-flight guarantees only one refresh runs even under parallel calls.
   */
  proactiveRefresh?: boolean;
};

function applyToken(token: string, headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = v.split('{token}').join(token);
  }
  return out;
}

/**
 * Bridge: turn a `BearerSessionManager` into a `LoadRequestProps` for use with
 * `createApiRegistry({ load })` or any other consumer of the `@react33/react-networking`
 * load contract.
 *
 * Behavior per call:
 *   1. If `proactiveRefresh` and the access token is expired AND a refresh token exists,
 *      `await session.ensureFreshSession()` (coalesced across concurrent callers).
 *   2. If there's still no access token, return `shared` unchanged (no auth header attached).
 *   3. Otherwise, merge the rendered header template into `shared` via `mergeRequestProps`.
 *
 * Does **not** retry on 401. For that, configure `retries: { 401: 1 }` + an `onRetry` that
 * awaits `session.ensureFreshSession()` directly in `createApiRegistry`. See README.
 */
export function createBearerSessionLoad<TTokens>(
  session: BearerSessionManager<TTokens>,
  options: CreateBearerSessionLoadOptions = {},
): LoadRequestProps {
  const { headers = DEFAULT_HEADERS, proactiveRefresh = true } = options;

  return async (shared: RequestProps) => {
    if (proactiveRefresh && session.isAccessTokenExpired() && session.hasRefreshToken()) {
      await session.ensureFreshSession();
    }
    const access = session.getAccessToken();
    if (!access) return shared;
    return mergeRequestProps(shared, { headers: applyToken(access, headers) });
  };
}
