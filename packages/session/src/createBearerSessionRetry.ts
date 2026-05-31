import type { ApiRegistryDefaults, RetryBudget } from '@react33/react-networking';
import type { BearerSessionManager } from './bearer-session';

export type CreateBearerSessionRetryOptions = {
  /**
   * Retry budget — same shape as `RetryBudget` in `@react33/react-networking` and as
   * `react33Session.sessions.<name>.retry.statuses` in `react33.config.json`.
   * Default `{ 401: 1 }`: retry once on unauthorized, after the refresh runs.
   */
  statuses?: RetryBudget;
  /**
   * Body-level error code that marks a 401 as refresh-eligible. **Opt-in.**
   *
   * - **Omitted** — every 401 triggers `ensureFreshSession()`.
   * - **Set** — only a 401 whose `response.data.code` equals this string triggers a refresh.
   *   Any other code, OR no code at all, is **terminal** (no refresh): once you declare that
   *   your backend tags refresh-eligible 401s, the absence of that tag means "not eligible"
   *   — a revoked session, an IP-binding mismatch, a server-side session-time limit. The
   *   failed retry then surfaces to the caller as a normal 401.
   */
  tokenExpiredCode?: string;
};

/** Read a `code` string off a response body, tolerating any shape. */
function extractCode(data: unknown): string | undefined {
  if (data && typeof data === 'object' && 'code' in data) {
    const code = (data as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/**
 * Build the `ApiRegistryDefaults` (retry budget + reactive `onRetry`) for one bearer session.
 *
 * The `@react33/react-session` codegen emits a call to this helper per-API into
 * `apiRuntime.defaultsByApi`, so a 401 from an API authenticated by this session refreshes
 * **this** session's token — never another's. Equally usable handwritten.
 *
 * `onRetry` runs `session.ensureFreshSession()`; the manager's single-flight guarantees one
 * refresh even under parallel callers (the proactive `createBearerSessionLoad` path included).
 * The `load` re-runs before the retried request, so the refreshed token reaches it.
 *
 * A retried request that carries `skipLoad` (an OpenAPI public route — notably the refresh
 * endpoint itself) is treated as terminal: refreshing would be re-entrant (the refresh request
 * awaiting its own `ensureFreshSession()`), and a public route's 401 is never a token-expiry
 * anyway. Such 401s surface to the caller unretried.
 */
export function createBearerSessionRetry<TTokens>(
  session: BearerSessionManager<TTokens>,
  options: CreateBearerSessionRetryOptions = {},
): ApiRegistryDefaults {
  const { statuses = { 401: 1 }, tokenExpiredCode } = options;
  return {
    retries: statuses,
    onRetry: async ({ status, response, skipLoad }) => {
      if (status !== 401) return;
      if (skipLoad) return; // public / load-bypassed request: refresh would re-enter itself
      if (tokenExpiredCode !== undefined) {
        const code = extractCode(response?.data);
        if (code !== tokenExpiredCode) return; // absent or different → terminal: no refresh
      }
      await session.ensureFreshSession();
    },
  };
}
