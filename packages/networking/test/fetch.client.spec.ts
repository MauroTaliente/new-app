import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAsyncFetch } from '../src/fetch/fetch.client.js';
import HttpCode from '../src/types/http-status-code.js';

describe('useAsyncFetch', () => {
  it('runs action on trigger and exposes data', async () => {
    const { result } = renderHook(() =>
      useAsyncFetch(
        {
          name: 't1',
          action: async () => ({ status: HttpCode.OK, data: { n: 1 } }),
        },
        [],
      ),
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
      useAsyncFetch({ name: 'p1', prevent: true, action }, []),
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
      useAsyncFetch({ name: 'r1', action, retries: 2, retryDelayMs: 0 }, []),
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
      useAsyncFetch({ name: 'n1', action, retries: 3 }, []),
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
      useAsyncFetch(
        {
          name: 'i2',
          action: async () => deferred,
        },
        [],
      ),
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
});
