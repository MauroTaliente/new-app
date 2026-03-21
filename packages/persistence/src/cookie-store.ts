import { mergeDeepRight, safeParse, safeStringify } from '@maurotaliente/react-helpers';
import type { DynamicCookieOptions } from '@maurotaliente/react-networking';

/** Minimal shape compatible with Next.js `cookies()` read/write API. */
export type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
  set(
    name: string,
    value: string,
    options?: {
      path?: string;
      domain?: string;
      maxAge?: number;
      expires?: Date;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    },
  ): void;
};

export type ServerCookieOptions<T> = DynamicCookieOptions<T> & {
  setOptions?: Parameters<CookieStoreLike['set']>[2];
};

export function getCookieFromStore<T>(store: CookieStoreLike, options: DynamicCookieOptions<T>): T {
  const { name, initData } = options;
  const raw = store.get(name)?.value;
  const rawData = raw !== undefined ? safeParse<T>(raw, null) : null;
  if (rawData === null || rawData === undefined) {
    return initData as T;
  }
  if (
    initData !== undefined &&
    typeof initData === 'object' &&
    initData !== null &&
    typeof rawData === 'object' &&
    rawData !== null &&
    !Array.isArray(rawData)
  ) {
    return mergeDeepRight(initData as object, rawData as object) as T;
  }
  return rawData as T;
}

export function setCookieInStore<T>(
  store: CookieStoreLike,
  options: ServerCookieOptions<T>,
): T {
  const { name, params, setOptions } = options;
  const raw = safeStringify(params, 0, '');
  store.set(name, raw, setOptions);
  return params as T;
}

export function putCookieInStore<T>(store: CookieStoreLike, options: ServerCookieOptions<T>): T {
  const { name, params, initData, setOptions } = options;
  const preData = getCookieFromStore(store, { name, initData });
  let data: T;
  if (
    preData !== undefined &&
    typeof preData === 'object' &&
    preData !== null &&
    params !== undefined &&
    typeof params === 'object' &&
    params !== null
  ) {
    data = mergeDeepRight(preData as object, params as object) as T;
  } else {
    data = params as T;
  }
  const rawData = data !== undefined && data !== null ? safeStringify(data, 0, '') : '';
  store.set(name, rawData, setOptions);
  return data;
}
