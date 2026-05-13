'use client';

import { useAsyncFetch, HttpCode } from '@react33/react-networking';
import type { Action, DynamicOptions } from '@react33/react-networking';
import type { StorageDriverOptions } from './storage';
import { getSessionStorage, putSessionStorage, setSessionStorage } from './storage';

function useGetSession<Params, Data, Response>(options: DynamicOptions<Params, Data, Response>, watch: unknown[] = []) {
  const action: Action<Params, Data> = async () => {
    if (!options.name || typeof window === 'undefined') {
      return { data: options.initData as Data, status: HttpCode.NOT_ACCEPTABLE };
    }
    const data = getSessionStorage(options as StorageDriverOptions<Data>) as Data;
    return { data, status: HttpCode.OK };
  };
  return useAsyncFetch({ ...options, action }, watch);
}

function useSetSession<Params, Data, Response>(options: DynamicOptions<Params, Data, Response>, watch: unknown[] = []) {
  const action: Action<Params, Data> = async (params) => {
    if (!options.name || typeof window === 'undefined') {
      return { data: params as Data, status: HttpCode.NOT_ACCEPTABLE };
    }
    const data = setSessionStorage({ ...options, params } as StorageDriverOptions<Data>) as Data;
    return { data, status: HttpCode.OK };
  };
  return useAsyncFetch({ ...options, action }, watch);
}

function usePutSession<Params, Data, Response>(options: DynamicOptions<Params, Data, Response>, watch: unknown[] = []) {
  const action: Action<Params, Data> = async (params) => {
    if (!options.name || typeof window === 'undefined') {
      return { data: params as Data, status: HttpCode.NOT_ACCEPTABLE };
    }
    const data = putSessionStorage({ ...options, params } as StorageDriverOptions<Data>) as Data;
    return { data, status: HttpCode.OK };
  };
  return useAsyncFetch({ ...options, action }, watch);
}

export { useGetSession, useSetSession, usePutSession };
