import { isArray, isObject, mergeDeepRight } from '@react33/react-helpers';
import type { JoinResponsesProps, HttpMethod } from './types';

/** HTTP statuses after which another attempt may help (unstable server, timeout, rate limit). */
export const shouldRetryAfterHttpFailure = (status: number): boolean => {
  if (status >= 500) return true;
  if (status === 408 || status === 429) return true;
  return false;
};

export const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
