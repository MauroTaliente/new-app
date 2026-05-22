import type { LoadRequestProps, RequestProps } from '@react33/react-networking';
import { mergeRequestProps } from '@react33/react-networking';
import type { BearerStaticSessionManager } from './bearer-static-session';

/** Default header template — overridable. The literal `{token}` is replaced by the access token. */
const DEFAULT_HEADERS: Readonly<Record<string, string>> = {
  Authorization: 'Bearer {token}',
};

export type CreateBearerStaticSessionLoadOptions = {
  /**
   * Headers to merge into each request. Any occurrence of `{token}` in a header value is
   * replaced by the current access token. Defaults to `{ Authorization: 'Bearer {token}' }`.
   */
  headers?: Record<string, string>;
};

function applyToken(token: string, headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = v.split('{token}').join(token);
  }
  return out;
}

/**
 * Bridge: turn a `BearerStaticSessionManager` into a `LoadRequestProps`.
 *
 * Per call: if there is no access token, return `shared` unchanged (no auth header). Otherwise
 * merge the rendered header template into `shared`. Unlike `createBearerSessionLoad`, there is
 * **no proactive refresh** — the `bearer-static` strategy has no refresh flow. An expired token
 * is sent as-is; handle the resulting 401 as a re-authentication trigger at the app level.
 */
export function createBearerStaticSessionLoad<TTokens>(
  session: BearerStaticSessionManager<TTokens>,
  options: CreateBearerStaticSessionLoadOptions = {},
): LoadRequestProps {
  const { headers = DEFAULT_HEADERS } = options;

  return async (shared: RequestProps) => {
    const access = session.getAccessToken();
    if (!access) return shared;
    return mergeRequestProps(shared, { headers: applyToken(access, headers) });
  };
}
