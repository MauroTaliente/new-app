'use client';

import { useAsyncFetch, HttpCode } from '@react33/react-networking';
import type { Action, DynamicOptions } from '@react33/react-networking';
import type { StorageDriverOptions } from './storage';
import { getLocalStorage, putLocalStorage, setLocalStorage } from './storage';

function useGetLocal<Params, Data, Response>(options: DynamicOptions<Params, Data, Response>, watch: unknown[] = []) {
  const action: Action<Params, Data> = async () => {
    if (!options.name || typeof window === 'undefined') {
      return { data: options.initData as Data, status: HttpCode.NOT_ACCEPTABLE };
    }
    const data = getLocalStorage(options as StorageDriverOptions<Data>) as Data;
    return { data, status: HttpCode.OK };
  };
  return useAsyncFetch({ ...options, action }, watch);
}

function useSetLocal<Params, Data, Response>(options: DynamicOptions<Params, Data, Response>, watch: unknown[] = []) {
  const action: Action<Params, Data> = async (params) => {
    if (!options.name || typeof window === 'undefined') {
      return { data: params as Data, status: HttpCode.NOT_ACCEPTABLE };
    }
    const data = setLocalStorage({ ...options, params } as StorageDriverOptions<Data>) as Data;
    return { data, status: HttpCode.OK };
  };
  return useAsyncFetch({ ...options, action }, watch);
}

function usePutLocal<Params, Data, Response>(options: DynamicOptions<Params, Data, Response>, watch: unknown[] = []) {
  const action: Action<Params, Data> = async (params) => {
    if (!options.name || typeof window === 'undefined') {
      return { data: params as Data, status: HttpCode.NOT_ACCEPTABLE };
    }
    const data = putLocalStorage({ ...options, params } as StorageDriverOptions<Data>) as Data;
    return { data, status: HttpCode.OK };
  };
  return useAsyncFetch({ ...options, action }, watch);
}

export { useGetLocal, useSetLocal, usePutLocal };
