import { applyTimeout, buildRequestBody, buildRequestUrl, shouldRetry, sleepMs } from '../helpers';
import {
  type Request,
  type RequestReturn,
  type RequestProps,
  LoadRequestProps,
  HttpCode,
} from '../types';

/**
 * Single fetch attempt. Pure: no retry loop. Honors `timeoutMs` per call by combining the
 * caller's `signal` with an internal `AbortController`. Aborted/thrown calls bubble up — the
 * surrounding `createDataFlow` decides whether to retry.
 */
const request = async <Params, Data>({
  url = '/',
  method = 'GET',
  headers,
  body,
  // Pull retry/onRetry/retryDelayMs/skipLoad out of `settings` so they don't leak into `RequestInit`.
  retries: _retries,
  retryDelayMs: _retryDelayMs,
  onRetry: _onRetry,
  skipLoad: _skipLoad,
  timeoutMs,
  signal: externalSignal,
  ...settings
}: RequestProps<Params>): Promise<RequestReturn<Data>> => {
  const reqHeaders = new Headers(headers);
  const reqBody = buildRequestBody(method, body);
  const reqUrl = buildRequestUrl(url, method, body);

  const { signal, cleanup } = applyTimeout(externalSignal ?? undefined, timeoutMs);

  const ready: RequestInit = {
    ...settings,
    method,
    headers: reqHeaders,
    body: !['GET', 'HEAD'].includes(method) ? reqBody : undefined,
    ...(signal ? { signal } : {}),
  };

  try {
    const response = await fetch(reqUrl, ready);
    const resType = response.headers.get('content-type') || '';
    const rawText = (await response.text()) || '';
    const isJson = resType.includes('json');

    let data = rawText as any;
    if (isJson && rawText) {
      try { data = JSON.parse(rawText) as Data; }
      catch { data = rawText; }
    }

    return { ...response, status: response.status as HttpCode, data };
  } finally {
    cleanup();
  }
};

/**
 * Build a `requestReady` closure that:
 *   1. Re-runs `load(shared)` before each attempt (so refreshed auth lands in the next request).
 *   2. Calls `request` once.
 *   3. On non-2xx or thrown error, consults `shouldRetry` (budget by status, see `RetryBudget`).
 *   4. Awaits `onRetry(ctx)` between attempts, then sleeps `retryDelayMs`.
 *   5. Repeats until budget is exhausted or a 2xx response is returned.
 *
 * Throws are surfaced as `status: 0` for retry decisions. If retries run out on a throw, the
 * original error is re-thrown to preserve diagnostics.
 */
const createDataFlow = (
  shared: RequestProps,
  load: LoadRequestProps = async () => ({}),
) => {
  const requestReady = async <Params, Data>(
    props: RequestProps<Params>,
  ): Promise<RequestReturn<Data>> => {
    const usedByStatus = new Map<number, number>();
    let totalUsed = 0;
    let attempt = 0;
    let lastResponse: RequestReturn<Data> | undefined;
    let lastError: unknown;

    while (true) {
      // Reload before each attempt: lets `onRetry` (e.g. token refresh) take effect on the next try.
      // `skipLoad` requests bypass `load` entirely — see `RequestProps.skipLoad` (breaks the
      // refresh-endpoint deadlock where the load would re-trigger the very refresh in progress).
      const loadedProps = props.skipLoad ? {} : await load(shared);

      const baseUrl = shared.url ?? '';
      const childUrl = props.url ?? '';
      const mergedUrl = baseUrl && childUrl
        ? `${baseUrl}${childUrl}`
        : baseUrl || childUrl || '/';

      const mergedProps = {
        ...shared,
        ...loadedProps,
        ...props,
        url: mergedUrl,
      } as RequestProps<Params>;

      let status: number;
      try {
        lastResponse = await request<Params, Data>(mergedProps);
        lastError = undefined;
        status = lastResponse.status;
        if (status >= 200 && status < 300) {
          return lastResponse;
        }
      } catch (err) {
        lastError = err;
        lastResponse = undefined;
        status = 0; // thrown / aborted: no response received
      }

      if (!shouldRetry(mergedProps.retries, status, totalUsed, usedByStatus)) {
        break;
      }

      if (mergedProps.onRetry) {
        await mergedProps.onRetry({
          status: status as HttpCode,
          attempt,
          // Mutually exclusive: response on receive, error on throw. status === 0 ⇔ no response.
          ...(lastResponse !== undefined ? { response: lastResponse } : {}),
          ...(lastError !== undefined ? { error: lastError } : {}),
          ...(mergedProps.skipLoad ? { skipLoad: true } : {}),
        });
      }
      const delay = mergedProps.retryDelayMs ?? 0;
      if (delay > 0) await sleepMs(delay);

      totalUsed++;
      usedByStatus.set(status, (usedByStatus.get(status) ?? 0) + 1);
      attempt++;
    }

    if (lastResponse !== undefined) return lastResponse;
    // Out of retries on a thrown error — preserve original diagnostic.
    throw lastError;
  };

  return requestReady;
};

export { request, createDataFlow };
export type { Request, RequestProps, RequestReturn };
