'use client';

/**
 * Client hook: one in-flight request per instance; see README in this package.
 */

import { useState, useEffect, useRef } from 'react';
import { useMemo, useCallback } from 'use-memo-one';
import { isDeepEqual } from '@react33/react-helpers';
import { shouldRetryAfterHttpFailure, sleepMs } from '../helpers';
import {
  buildRequestCacheKey,
  defaultRequestCache,
  type RequestCache as LibRequestCache,
  type RequestCacheOption,
} from '../cache/request-cache';
import {
  HttpCode,
  emptyMeta,
  type StaticMeta,
  type DynamicOptions,
  type DynamicModel,
  type ResponseOrData,
  type RequestReturn,
  type Context,
} from '../types';

function resolveRequestCacheOption(
  option: RequestCacheOption | undefined,
): LibRequestCache | undefined {
  if (option === undefined) return undefined;
  if (option === 'global') return defaultRequestCache;
  return option;
}

const useAsyncFetch = <Params, Data, Response = null>(
  {
    name,
    state,
    params: baseParams,
    auto = false,
    prevent = false,
    retries = 0,
    retryDelayMs = 0,
    verbose = false,
    initData = undefined,
    initLoading = false,
    action = (params?: Params) =>
      ({ status: HttpCode.OK, data: params as unknown as Data }) as RequestReturn<Data>,
    setter = ({ data }: RequestReturn<Data>) => data as ResponseOrData<Data, Response>,
    updater = () => { },
    onChange = () => { },
    onMount = () => { },
    onBefore = () => { },
    onFinal = () => { },
    onSuccess = () => { },
    onError = () => { },
    onUnauthorized = () => { },
    requestCache,
    cacheKey,
    cacheTtlMs,
    scope,
  }: DynamicOptions<Params, Data, Response>,
  watch: readonly unknown[],
) => {
  const memo = useMemo(() => ({
    author: 'unknown',
    initMount: false,
    localMeta: { ...emptyMeta },
    loading: initLoading || auto || false,
    params: baseParams,
    isRepeated: false,
    isFirst: true,
    data: initData as ResponseOrData<Data, Response>,
    onFinal,
    error: undefined as unknown,
  }), []);

  const remoteMeta = state?.recordList?.[name];
  const meta: StaticMeta = remoteMeta || memo.localMeta;

  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  countRef.current = count;

  const [endCount, setEndCount] = useState(0);
  const [status, setStatus] = useState<HttpCode>(0);

  const optsRef = useRef({
    name,
    action,
    setter,
    updater,
    prevent,
    verbose,
    retries,
    retryDelayMs,
    onChange,
    onMount,
    onBefore,
    onSuccess,
    onError,
    onUnauthorized,
    requestCache,
    cacheKey,
    cacheTtlMs,
    scope,
  });

  optsRef.current = {
    name,
    action,
    setter,
    updater,
    prevent,
    verbose,
    retries,
    retryDelayMs,
    onChange,
    onMount,
    onBefore,
    onSuccess,
    onError,
    onUnauthorized,
    requestCache,
    cacheKey,
    cacheTtlMs,
    scope,
  };

  const trigger = useCallback((newParams: any, onFinalCb: any, newAuthor = '') => {
    memo.isRepeated = isDeepEqual(memo.params, newParams);
    if (memo.isRepeated && memo.loading) return;
    memo.params = newParams;
    memo.author = newAuthor;
    memo.onFinal = onFinalCb || (() => { });
    setCount((pre) => pre + 1);
  }, []) as DynamicModel<Params, Data, Response>['trigger'];

  const initialLoading = Boolean(memo.loading && meta.success === 0);
  const hasLoadedOnce = meta.success > 0;

  const common = {
    trigger,
    meta,
    status,
    loading: memo.loading,
    initialLoading,
    hasLoadedOnce,
    data: memo.data,
    params: memo.params,
    isRepeated: memo.isRepeated,
    isFirst: memo.isFirst,
    author: memo.author,
    error: memo.error,
  } as DynamicModel<Params, Data, Response>;

  const metaController = useCallback((nextStatus: HttpCode) => {
    const updateMeta = (prop: keyof StaticMeta) => {
      const add = { [prop]: memo.localMeta[prop] + 1 };
      const data = { ...memo.localMeta, ...add };
      memo.localMeta = data;
      optsRef.current.updater({ recordList: { [optsRef.current.name]: data } } as Context);
    };
    if (nextStatus > 0 && nextStatus < 200) return updateMeta('triggered');
    if (nextStatus >= 200 && nextStatus < 300) return updateMeta('success');
    if (nextStatus >= 300 && nextStatus < 400) return updateMeta('prevented');
    if (nextStatus >= 400 && nextStatus < 500) return updateMeta('block');
    if (nextStatus >= 500) return updateMeta('error');
  }, []);

  const hooksController = useCallback((nextStatus: HttpCode, inCommon: typeof common) => {
    const o = optsRef.current;
    if (nextStatus === 0 && countRef.current === 0) o.onMount(inCommon);
    if (nextStatus === 100) o.onBefore(inCommon);
    if (nextStatus >= 200 && nextStatus < 300) o.onSuccess(inCommon);
    if (nextStatus >= 200) memo.onFinal(inCommon);
    if (nextStatus === 401) o.onUnauthorized(inCommon);
    if (nextStatus >= 400) o.onError(inCommon);
  }, []);

  const endController = useCallback((nextStatus: HttpCode) => {
    if (nextStatus > 100) setStatus(0);
    if (memo.isFirst) memo.isFirst = false;
  }, []);

  const verboseConsoleController = useCallback((nextStatus: HttpCode) => {
    const o = optsRef.current;
    if (!o.verbose) return;
    if (nextStatus === 100) console.log(`🚀 ${o.name}: bringing/sending data\n`);
    if (nextStatus === 200) console.log(`🎉 ${o.name}: data successfully\n`);
    if (nextStatus === 201) console.log(`🎉 ${o.name}: create successfully\n`);
    if (nextStatus === 204) console.log(`🥸 ${o.name}: no content \n`);
    if (nextStatus === 300) console.log(`🏓 ${o.name}: prevent request\n`);
    if (nextStatus === 401) console.log(`👻 ${o.name}: permissions denied\n`);
    if (nextStatus === 500) {
      console.log(`💩 ${o.name}: server error\n`);
      console.log(`error: ${JSON.stringify(memo.error)}`);
    }
  }, []);

  useEffect(() => {
    optsRef.current.onChange(common);
    metaController(status);
    return () => { };
  }, [status]);

  useEffect(() => {
    hooksController(status as HttpCode, common);
    verboseConsoleController(status);
    endController(status);
    return () => { };
  }, [endCount]);

  useEffect(() => {
    if (auto) {
      memo.isRepeated = isDeepEqual(memo.params, baseParams);
      if (memo.isRepeated && memo.loading && memo.initMount) return;
      memo.params = baseParams;
      memo.author = 'unknown';
      setCount((pre) => pre + 1);
    }
    if (!memo.initMount) {
      memo.initMount = true;
    }
    return () => { };
  }, [...watch]);

  useEffect(() => {
    if (count <= endCount) return;
    let alive = true;

    const run = async () => {
      try {
        const o = optsRef.current;
        if (o.prevent) {
          if (!alive) return;
          setStatus(300);
          return;
        }

        const maxAttempts = 1 + Math.max(0, o.retries);
        const delayMs = Math.max(0, o.retryDelayMs ?? 0);
        const params = memo.params;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (!alive) return;
          if (attempt > 0) {
            await sleepMs(delayMs);
            if (!alive) return;
          }

          try {
            memo.loading = true;
            setStatus(100);
            const latest = optsRef.current;
            const cache = resolveRequestCacheOption(latest.requestCache);
            const key =
              latest.cacheKey ?? buildRequestCacheKey(latest.name, params, latest.scope);
            const response = cache
              ? await cache.run<RequestReturn<Data>>(key, latest.cacheTtlMs, () =>
                  Promise.resolve(latest.action(params)),
                )
              : await latest.action(params);
            if (!alive) return;

            memo.error = response.error || response.errors;
            memo.data = latest.setter(response, params) as ResponseOrData<Data, Response>;

            const ok = response.status >= 200 && response.status < 300;
            setStatus(response.status);

            if (ok) {
              break;
            }

            const canHttpRetry =
              shouldRetryAfterHttpFailure(response.status) &&
              attempt < maxAttempts - 1;
            if (!canHttpRetry) {
              break;
            }
          } catch (error: unknown) {
            if (!alive) return;
            if (memo.error) console.error(memo.error);
            if (error) memo.error = error;
            const errStatus = ((error as { status?: number })?.status ?? 500) as HttpCode;
            setStatus(errStatus);

            if (attempt >= maxAttempts - 1) {
              break;
            }
          }
        }
      } finally {
        memo.loading = false;
        setEndCount((pre) => pre + 1);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [count]);

  return common;
};

export { useAsyncFetch };
