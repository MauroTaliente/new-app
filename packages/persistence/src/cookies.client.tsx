'use client';

import { useAsyncFetch, HttpCode } from '@react33/react-networking';
import type { Action, DynamicOptions } from '@react33/react-networking';
import type { CookieClientOptions } from './cookie-browser';
import { getCookie, putCookie, setCookie } from './cookie-browser';

type CookieHookOptions<T> = CookieClientOptions<T> &
  Partial<Omit<DynamicOptions<unknown, T, null>, keyof CookieClientOptions<T>>>;

function useGetCookie<T>(options: CookieHookOptions<T>) {
  const action: Action<unknown, T> = async () => {
    if (!options.name || typeof document === 'undefined') {
      return { data: options.initData as T, status: HttpCode.NOT_ACCEPTABLE };
    }
    const data = getCookie(options) as T;
    return { data, status: HttpCode.OK };
  };
  return useAsyncFetch<unknown, T, null>({ ...options, action } as DynamicOptions<unknown, T, null>);
}

function useSetCookie<T>(options: CookieHookOptions<T>) {
  const action: Action<unknown, T> = async (data: unknown) => {
    if (!options.name || typeof document === 'undefined') {
      return { data: data as T, status: HttpCode.NOT_ACCEPTABLE };
    }
    const out = setCookie({ ...options, params: data as T });
    return { data: out as T, status: HttpCode.OK };
  };
  return useAsyncFetch<unknown, T, null>({ ...options, action } as DynamicOptions<unknown, T, null>);
}

function usePutCookie<T>(options: CookieHookOptions<T>) {
  const action: Action<unknown, T> = async (rawData: unknown) => {
    if (!options.name || typeof document === 'undefined') {
      return { data: rawData as T, status: HttpCode.NOT_ACCEPTABLE };
    }
    const out = putCookie({ ...options, params: rawData as T });
    return { data: out as T, status: HttpCode.OK };
  };
  return useAsyncFetch<unknown, T, null>({ ...options, action } as DynamicOptions<unknown, T, null>);
}

export { useGetCookie, useSetCookie, usePutCookie };
