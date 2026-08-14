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

// ---------------------------------------------------------------------------
// 2026-08-14 — three augments born from a real consumer bug hunt (Trivo):
// data survived by error envelopes, the status pulse read as a level, and
// mount-time gating on inputs that resolve after mount. Each case below is
// the distilled version of a production symptom.
// ---------------------------------------------------------------------------

describe('useAsyncFetch — data keeps last good value on non-2xx', () => {
  it('a 401 envelope does not replace initData', async () => {
    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'lg1',
        initData: { items: ['seeded'] },
        action: async () => ({
          status: HttpCode.UNAUTHORIZED,
          data: { error: { code: 'unauthenticated' } } as never,
        }),
      }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.hasFailed).toBe(true);
    });
    // The page keeps rendering the seed — not the envelope wearing its type.
    expect(result.current.data).toEqual({ items: ['seeded'] });
    // The body IS the error payload, so it lands where errors live.
    expect(result.current.error).toEqual({ error: { code: 'unauthenticated' } });
  });

  it('a failed refetch does not clobber previously loaded data', async () => {
    let fail = false;
    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'lg2',
        action: async () =>
          fail
            ? { status: HttpCode.INTERNAL_SERVER_ERROR, data: { error: 'boom' } as never }
            : { status: HttpCode.OK, data: { rows: [1, 2, 3] } },
      }),
    );

    act(() => {
      result.current.trigger(undefined);
    });
    await waitFor(() => {
      expect(result.current.data).toEqual({ rows: [1, 2, 3] });
    });

    fail = true;
    act(() => {
      result.current.trigger(undefined);
    });
    await waitFor(() => {
      expect(result.current.hasFailed).toBe(true);
    });
    expect(result.current.data).toEqual({ rows: [1, 2, 3] });
  });
});

describe('useAsyncFetch — lastStatus/hasFailed are levels beside the status pulse', () => {
  it('lastStatus persists after the status pulse resets to 0', async () => {
    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'ls1',
        action: async () => ({ status: HttpCode.OK, data: { ok: true } }),
      }),
    );

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.hasLoadedOnce).toBe(true);
    });
    // The pulse cleared (form-latch semantics)…
    expect(result.current.status).toBe(0);
    // …but the level survives: this is what persistent conditions read.
    expect(result.current.lastStatus).toBe(HttpCode.OK);
  });

  it('hasFailed flips on a 4xx and lastStatus records it', async () => {
    const { result } = renderHook(() =>
      useAsyncFetch({
        name: 'ls2',
        action: async () => ({ status: HttpCode.NOT_FOUND, data: null as never }),
      }),
    );

    expect(result.current.hasFailed).toBe(false);

    act(() => {
      result.current.trigger(undefined);
    });

    await waitFor(() => {
      expect(result.current.hasFailed).toBe(true);
    });
    expect(result.current.lastStatus).toBe(HttpCode.NOT_FOUND);
    expect(result.current.hasLoadedOnce).toBe(false);
  });
});

describe('useAsyncFetch — `when` declarative gate', () => {
  it('fires on mount when the gate starts true', async () => {
    const action = vi.fn(async () => ({ status: HttpCode.OK, data: { n: 1 } }));
    const { result } = renderHook(() => useAsyncFetch({ name: 'w1', when: true, action }));

    await waitFor(() => {
      expect(result.current.hasLoadedOnce).toBe(true);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('fires when the gate rises AFTER mount — the fetchOnMount gap', async () => {
    // The consumer bug this encodes: `fetchOnMount: role === 'ADMIN'` where the
    // role comes from a token still refreshing at mount. The mount-time
    // decision is false, the input turns true later, and nothing recovers.
    const action = vi.fn(async () => ({ status: HttpCode.OK, data: { n: 1 } }));
    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) => useAsyncFetch({ name: 'w2', when: ready, action }),
      { initialProps: { ready: false } },
    );

    expect(action).not.toHaveBeenCalled();

    rerender({ ready: true });

    await waitFor(() => {
      expect(result.current.hasLoadedOnce).toBe(true);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not fire while the gate stays false, and does not block manual trigger', async () => {
    const action = vi.fn(async () => ({ status: HttpCode.OK, data: { n: 1 } }));
    const { result } = renderHook(() => useAsyncFetch({ name: 'w3', when: false, action }));

    expect(action).not.toHaveBeenCalled();

    // `when` gates its own firing only — a manual trigger still goes through
    // (deliberate divergence from react-query's `enabled`).
    act(() => {
      result.current.trigger(undefined);
    });
    await waitFor(() => {
      expect(result.current.hasLoadedOnce).toBe(true);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });
});
