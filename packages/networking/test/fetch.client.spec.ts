import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createRequestCache } from '../src/cache/request-cache.js';
import { useAsyncFetch } from '../src/fetch/fetch.client.js';
import HttpCode from '../src/types/http-status-code.js';

describe('useAsyncFetch', () => {
  it('runs action on trigger and exposes data', async () => {
    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 't1',
        action: async () => ({ status: HttpCode.OK, data: { n: 1 } }),
      }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ n: 1 });
      expect(result.current.meta.success).toBeGreaterThanOrEqual(1);
    });
    expect(result.current.status).toBe(0);
  });

  it('does not call action when prevent is true', async () => {
    const action = vi.fn(async () => ({ status: HttpCode.OK, data: {} }));

    const { result } = renderHook(() =>
      useAsyncFetch({ name: 'p1', prevent: true, action }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.meta.prevented).toBeGreaterThanOrEqual(1);
    });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.status).toBe(0);
  });

  it('retries on 503 then succeeds', async () => {
    let calls = 0;
    const action = vi.fn(async () => {
      calls += 1;
      if (calls < 2) {
        return { status: HttpCode.SERVICE_UNAVAILABLE, data: null as any };
      }
      return { status: HttpCode.OK, data: { ok: true } };
    });

    const { result } = renderHook(() =>
      useAsyncFetch({ name: 'r1', action, retries: 2, retryDelayMs: 0 }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ ok: true });
      expect(result.current.meta.success).toBeGreaterThanOrEqual(1);
    });
    expect(action).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe(0);
  });

  it('does not retry on 404', async () => {
    const action = vi.fn(async () => ({
      status: HttpCode.NOT_FOUND,
      data: null as any,
    }));

    const { result } = renderHook(() =>
      useAsyncFetch({ name: 'n1', action, retries: 3 }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.meta.block).toBeGreaterThanOrEqual(1);
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(0);
  });

  it('initialLoading is true during first in-flight request', async () => {
    let resolve!: (v: { status: number; data: { x: number } }) => void;
    const deferred = new Promise<{ status: number; data: { x: number } }>((r) => {
      resolve = r;
    });

    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'i2',
        action: async () => deferred,
      }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
      expect(result.current.initialLoading).toBe(true);
    });

    await act(async () => {
      resolve({ status: HttpCode.OK, data: { x: 1 } });
    });

    await waitFor(() => {
      expect(result.current.hasLoadedOnce).toBe(true);
      expect(result.current.initialLoading).toBe(false);
    });
  });

  it('accepts requestCache preset global', async () => {
    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'cache-preset',
        requestCache: 'global',
        cacheTtlMs: 60_000,
        action: async () => ({ status: HttpCode.OK, data: { ok: true } }),
      }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ ok: true });
    });
  });

  it('fetchOnMount runs once on mount only', async () => {
    const action = vi.fn(async () => ({ status: HttpCode.OK, data: { n: 1 } }));

    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'mount-once',
        fetchOnMount: true,
        action,
      }),
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ n: 1 });
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('record-form retries: { 503: 2 } retries 503 up to twice', async () => {
    let calls = 0;
    const action = vi.fn(async () => {
      calls += 1;
      if (calls < 3) return { status: HttpCode.SERVICE_UNAVAILABLE, data: null as any };
      return { status: HttpCode.OK, data: { ok: true } };
    });

    const { result } = renderHook(() =>
      useAsyncFetch({ name: 'rec1', action, retries: { 503: 2 }, retryDelayMs: 0 }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ ok: true });
    });
    expect(action).toHaveBeenCalledTimes(3);
  });

  it('record-form retries are exhaustive — 500 with { 503: 5 } does not retry', async () => {
    const action = vi.fn(async () => ({
      status: 500 as HttpCode,
      data: null as any,
    }));

    const { result } = renderHook(() =>
      useAsyncFetch({ name: 'rec2', action, retries: { 503: 5 }, retryDelayMs: 0 }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.meta.error).toBeGreaterThanOrEqual(1);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry between attempts with the failed status', async () => {
    let calls = 0;
    const action = vi.fn(async () => {
      calls += 1;
      if (calls < 2) return { status: HttpCode.SERVICE_UNAVAILABLE, data: null as any };
      return { status: HttpCode.OK, data: { ok: true } };
    });
    const onRetry = vi.fn();

    const { result } = renderHook(() =>
      useAsyncFetch({ name: 'on-retry', action, retries: 1, retryDelayMs: 0, onRetry }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ ok: true });
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][0]).toMatchObject({ status: 503, attempt: 0 });
  });

  it('onRetry receives the hook common model + response + retry extras', async () => {
    let calls = 0;
    const action = vi.fn(async () => {
      calls += 1;
      if (calls < 2)
        return {
          status: HttpCode.SERVICE_UNAVAILABLE,
          data: { code: 'BUSY' } as any,
        };
      return { status: HttpCode.OK, data: { ok: true } };
    });
    const captured: any[] = [];
    const onRetry = vi.fn(async (model: any) => {
      captured.push(model);
    });

    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'on-retry-model',
        action,
        retries: 1,
        retryDelayMs: 0,
        onRetry,
      }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ ok: true });
    });

    expect(captured).toHaveLength(1);
    const model = captured[0];
    // Convention: model fields from `common` are present.
    expect(typeof model.trigger).toBe('function');
    expect(model.meta).toBeDefined();
    // Retry extras.
    expect(model.attempt).toBe(0);
    expect(model.status).toBe(503);
    expect(model.response).toBeDefined();
    expect(model.response.status).toBe(503);
    expect(model.response.data).toEqual({ code: 'BUSY' });
    expect(model.error).toBeUndefined();
  });

  it('accepts a custom RequestCache instance', async () => {
    const myCache = createRequestCache();
    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'cache-custom',
        requestCache: myCache,
        action: async () => ({ status: HttpCode.OK, data: { custom: true } }),
      }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ custom: true });
    });
  });
});
