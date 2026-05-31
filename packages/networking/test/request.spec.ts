import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, createDataFlow } from '../src/fetch/fetch.server.js';

describe('request', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('parses JSON response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ hello: 'world' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch;

    const res = await request<{ x: number }, { hello: string }>({
      url: 'https://api.test/x',
      method: 'GET',
    });

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ hello: 'world' });
  });

  it('returns text when not JSON', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('plain', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    ) as typeof fetch;

    const res = await request({ url: 'https://api.test/x', method: 'GET' });
    expect(res.data).toBe('plain');
  });
});

describe('createDataFlow', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('merges shared url with child url and applies load', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch;

    const ready = createDataFlow(
      { url: 'https://base.test' },
      async () => ({ headers: { Authorization: 'Bearer t' } }),
    );

    await ready({ url: '/v1', method: 'GET' });

    expect(globalThis.fetch).toHaveBeenCalled();
    const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(init.headers).toBeDefined();
  });

  it('retries on 503 with number-form budget then succeeds', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls < 3) return new Response('', { status: 503 });
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const ready = createDataFlow({ url: 'https://base.test' });
    const res = await ready({ url: '/v1', method: 'GET', retries: 3, retryDelayMs: 0 });

    expect(res.status).toBe(200);
    expect(calls).toBe(3);
  });

  it('record-form budget: { 503: 1 } retries 503 once but stops on 500', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) return new Response('', { status: 503 });
      return new Response('', { status: 500 });
    }) as typeof fetch;

    const ready = createDataFlow({ url: 'https://base.test' });
    const res = await ready({
      url: '/v1',
      method: 'GET',
      retries: { 503: 1 },
      retryDelayMs: 0,
    });

    expect(res.status).toBe(500);
    expect(calls).toBe(2);
  });

  it('record-form is exhaustive — 4xx not in map is not retried', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      return new Response('', { status: 401 });
    }) as typeof fetch;

    const ready = createDataFlow({ url: 'https://base.test' });
    const res = await ready({
      url: '/v1',
      method: 'GET',
      retries: { 503: 5 },
      retryDelayMs: 0,
    });

    expect(res.status).toBe(401);
    expect(calls).toBe(1);
  });

  it('awaits onRetry between attempts', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) return new Response('', { status: 503 });
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const seen: { status: number; attempt: number }[] = [];
    const onRetry = vi.fn(async (ctx: { status: number; attempt: number }) => {
      seen.push({ status: ctx.status, attempt: ctx.attempt });
    });

    const ready = createDataFlow({ url: 'https://base.test' });
    await ready({
      url: '/v1',
      method: 'GET',
      retries: 1,
      retryDelayMs: 0,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([{ status: 503, attempt: 0 }]);
  });

  it('re-runs load before each attempt (refreshed token reaches next request)', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) return new Response('', { status: 401 });
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    let access = 'old';
    const load = vi.fn(async () => ({ headers: { Authorization: `Bearer ${access}` } }));

    const ready = createDataFlow({ url: 'https://base.test' }, load);
    const res = await ready({
      url: '/v1',
      method: 'GET',
      retries: { 401: 1 },
      retryDelayMs: 0,
      onRetry: async () => {
        access = 'new';
      },
    });

    expect(res.status).toBe(200);
    expect(load).toHaveBeenCalledTimes(2);
    const headersOnAttempt2 = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1]
      .headers as Headers;
    expect(headersOnAttempt2.get('Authorization')).toBe('Bearer new');
  });

  it('onRetry receives the full response of the failed attempt (headers, body)', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) {
        return new Response('{"code":"TOKEN_EXPIRED"}', {
          status: 401,
          headers: {
            'content-type': 'application/json',
            'X-Request-Id': 'req-abc-123',
          },
        });
      }
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const captured: any[] = [];
    const onRetry = vi.fn(async (ctx: any) => {
      captured.push(ctx);
    });

    const ready = createDataFlow({ url: 'https://base.test' });
    await ready({
      url: '/v1',
      method: 'GET',
      retries: { 401: 1 },
      retryDelayMs: 0,
      onRetry,
    });

    expect(captured).toHaveLength(1);
    const ctx = captured[0];
    expect(ctx.status).toBe(401);
    expect(ctx.attempt).toBe(0);
    expect(ctx.response).toBeDefined();
    expect(ctx.response.status).toBe(401);
    expect(ctx.response.data).toEqual({ code: 'TOKEN_EXPIRED' });
    // Headers reachable on the response — enables Retry-After / correlation-id workflows.
    expect(ctx.response.headers.get('X-Request-Id')).toBe('req-abc-123');
    expect(ctx.error).toBeUndefined();
  });

  it('onRetry receives error (not response) when the attempt throws', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new Error('network down');
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const captured: any[] = [];
    const onRetry = vi.fn(async (ctx: any) => {
      captured.push(ctx);
    });

    const ready = createDataFlow({ url: 'https://base.test' });
    await ready({
      url: '/v1',
      method: 'GET',
      retries: 1,
      retryDelayMs: 0,
      onRetry,
    });

    expect(captured).toHaveLength(1);
    expect(captured[0].status).toBe(0);
    expect(captured[0].response).toBeUndefined();
    expect(captured[0].error).toBeInstanceOf(Error);
    expect((captured[0].error as Error).message).toBe('network down');
  });

  it('treats thrown fetch as status=0; retries under number-form budget', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new Error('network down');
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const onRetry = vi.fn();
    const ready = createDataFlow({ url: 'https://base.test' });
    const res = await ready({
      url: '/v1',
      method: 'GET',
      retries: 1,
      retryDelayMs: 0,
      onRetry,
    });

    expect(res.status).toBe(200);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][0].status).toBe(0);
  });

  it('throws when retries run out on a thrown error', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('persistent network failure');
    }) as typeof fetch;

    const ready = createDataFlow({ url: 'https://base.test' });
    await expect(
      ready({ url: '/v1', method: 'GET', retries: 0 }),
    ).rejects.toThrow(/persistent network failure/);
  });

  it('timeoutMs aborts a slow attempt (status=0) and retries via budget', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async (_url, init?: RequestInit) => {
      calls++;
      if (calls === 1) {
        // Simulate a hang — resolve only after abort.
        return await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        });
      }
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const ready = createDataFlow({ url: 'https://base.test' });
    const res = await ready({
      url: '/v1',
      method: 'GET',
      retries: 1,
      retryDelayMs: 0,
      timeoutMs: 20,
    });

    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  it('skipLoad: true bypasses the load entirely', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch;

    const load = vi.fn(async () => ({ headers: { Authorization: 'Bearer t' } }));
    const ready = createDataFlow({ url: 'https://base.test' }, load);

    await ready({ url: '/v1', method: 'GET', skipLoad: true });

    expect(load).not.toHaveBeenCalled();
    const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get('Authorization')).toBeNull();
  });

  it('skipLoad does not leak into RequestInit', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch;

    const ready = createDataFlow({ url: 'https://base.test' });
    await ready({ url: '/v1', method: 'GET', skipLoad: true });

    const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect('skipLoad' in init).toBe(false);
  });

  it('propagates skipLoad to the onRetry context', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) return new Response('', { status: 401 });
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const captured: any[] = [];
    const ready = createDataFlow({ url: 'https://base.test' });
    await ready({
      url: '/v1',
      method: 'GET',
      retries: { 401: 1 },
      retryDelayMs: 0,
      skipLoad: true,
      onRetry: async (ctx: any) => {
        captured.push(ctx);
      },
    });

    expect(captured).toHaveLength(1);
    expect(captured[0].skipLoad).toBe(true);
  });

  it('omits skipLoad from the onRetry context for a normal request', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls === 1) return new Response('', { status: 503 });
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const captured: any[] = [];
    const ready = createDataFlow({ url: 'https://base.test' });
    await ready({
      url: '/v1',
      method: 'GET',
      retries: 1,
      retryDelayMs: 0,
      onRetry: async (ctx: any) => {
        captured.push(ctx);
      },
    });

    expect(captured).toHaveLength(1);
    expect(captured[0].skipLoad).toBeUndefined();
  });
});
