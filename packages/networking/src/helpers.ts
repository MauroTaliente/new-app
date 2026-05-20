import { isArray, isObject, mergeDeepRight } from '@react33/react-helpers';
import type { JoinResponsesProps, HttpMethod, RetryBudget } from './types';

/** HTTP statuses after which another attempt may help (unstable server, timeout, rate limit). */
export const shouldRetryAfterHttpFailure = (status: number): boolean => {
  if (status >= 500) return true;
  if (status === 408 || status === 429) return true;
  return false;
};

/**
 * Single source of truth for "should this failed attempt be retried?".
 * Shared by `useAsyncFetch` (client) and `createDataFlow` (server).
 *
 * Number-form `retries`: capped by **total retries used**, status retriable iff
 * `shouldRetryAfterHttpFailure(status) || status === 0` (status `0` = thrown/aborted).
 * Backward-compatible with the legacy hook loop.
 *
 * Record-form `retries`: capped by **retries used for that specific status**.
 * Statuses not in the map have budget `0`. Cover throws/aborts via the `0` key.
 */
export const shouldRetry = (
  retries: RetryBudget | undefined,
  status: number,
  totalUsed: number,
  usedByStatus: ReadonlyMap<number, number>,
): boolean => {
  if (retries === undefined) return false;
  if (typeof retries === 'number') {
    if (retries <= 0) return false;
    if (!shouldRetryAfterHttpFailure(status) && status !== 0) return false;
    return totalUsed < retries;
  }
  const budget = retries[status as keyof typeof retries] ?? 0;
  if (budget <= 0) return false;
  return (usedByStatus.get(status) ?? 0) < budget;
};

export const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Combine an external `AbortSignal` with a timeout-driven one. Returns the merged signal
 * and a `cleanup` to clear the timer (call after the attempt resolves to avoid leaks).
 * If `timeoutMs` is `undefined`/`<=0`, returns the original signal unchanged.
 */
export const applyTimeout = (
  externalSignal: AbortSignal | undefined,
  timeoutMs: number | undefined,
): { signal: AbortSignal | undefined; cleanup: () => void } => {
  if (timeoutMs === undefined || timeoutMs <= 0) {
    return { signal: externalSignal, cleanup: () => {} };
  }
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort(externalSignal.reason);
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
};

const appendQueryParams = (baseUrl: string, params: Record<string, unknown>): string => {
  const url = new URL(baseUrl);
  const sp = url.searchParams;

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, String(v)));
      return;
    }

    sp.set(key, isObject(value) ? JSON.stringify(value) : String(value));
  });

  url.search = sp.toString();
  return url.toString();
};

export const buildRequestBody = (method: HttpMethod, body: any): RequestInit['body'] => {
  if (body instanceof FormData) return body;
  if (['GET', 'DELETE'].includes(method)) return undefined;
  if (isObject(body) || isArray(body)) return JSON.stringify(body);
  return body;
};

export const buildRequestUrl = (url: string, method: HttpMethod, body?: any): string => {
  if (['GET', 'DELETE'].includes(method) && body && isObject(body)) {
    return appendQueryParams(url, body);
  }
  return url;
};

export const joinResponses = <Responses,>(...responses: JoinResponsesProps<Responses>[]) => {
  return responses.reduce(
    (pre, { status, loading, data, errors }) => {
      const calcStatus = (() => {
        if (pre.status > 0 && status < 400) return pre.status;
        return status;
      })();
      const calcLoading = (() => {
        if (pre.loading || loading) return true;
        if (calcStatus === 100) return true;
        return false;
      })();
      const calcData = mergeDeepRight(pre.data, data || {});
      const calcErrors = mergeDeepRight(pre.errors, errors || {});
      return {
        loading: calcLoading,
        status: calcStatus,
        data: calcData,
        errors: calcErrors,
      };
    },
    {
      loading: false,
      status: 0,
      data: {},
      errors: {},
    } as any,
  );
};
