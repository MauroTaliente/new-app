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
  it('merges shared url with child url and applies load', async () => {
    const originalFetch = globalThis.fetch;
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

    globalThis.fetch = originalFetch;
  });
});
