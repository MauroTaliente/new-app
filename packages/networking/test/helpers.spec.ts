import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldRetryAfterHttpFailure,
  shouldRetry,
  applyTimeout,
  sleepMs,
  buildRequestUrl,
  buildRequestBody,
  joinResponses,
} from '../src/helpers.js';
import { buildPathUrl, resolveOpenApiRequest } from '../src/path-url.js';
import HttpCode from '../src/types/http-status-code.js';

describe('shouldRetryAfterHttpFailure', () => {
  it('retries on 5xx, 408, 429', () => {
    expect(shouldRetryAfterHttpFailure(500)).toBe(true);
    expect(shouldRetryAfterHttpFailure(503)).toBe(true);
    expect(shouldRetryAfterHttpFailure(408)).toBe(true);
    expect(shouldRetryAfterHttpFailure(429)).toBe(true);
  });

  it('does not retry on typical 4xx', () => {
    expect(shouldRetryAfterHttpFailure(400)).toBe(false);
    expect(shouldRetryAfterHttpFailure(404)).toBe(false);
    expect(shouldRetryAfterHttpFailure(401)).toBe(false);
  });
});

describe('sleepMs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the given delay', async () => {
    const p = sleepMs(100);
    vi.advanceTimersByTime(100);
    await expect(p).resolves.toBeUndefined();
  });
});

describe('buildRequestUrl', () => {
  it('appends query for GET with object body', () => {
    const url = buildRequestUrl('https://x.test/api', 'GET', { q: 'a', n: 2 });
    expect(url).toContain('q=a');
    expect(url).toContain('n=2');
  });

  it('returns url unchanged for POST with body', () => {
    expect(buildRequestUrl('https://x.test/api', 'POST', { a: 1 })).toBe('https://x.test/api');
  });
});

describe('buildPathUrl', () => {
  it('substitutes path params', () => {
    expect(buildPathUrl('/v1/trips/{tripId}', { tripId: 'abc-123' })).toBe('/v1/trips/abc-123');
  });

  it('throws when param missing', () => {
    expect(() => buildPathUrl('/v1/trips/{tripId}', {})).toThrow(/missing path param/);
  });
});

describe('resolveOpenApiRequest', () => {
  it('maps query for GET', () => {
    expect(
      resolveOpenApiRequest('/v1/trips', 'GET', { query: { page: 1 } }),
    ).toEqual({ url: '/v1/trips', body: { page: 1 } });
  });

  it('maps body for POST', () => {
    expect(
      resolveOpenApiRequest('/v1/auth/login', 'POST', { body: { email: 'a@b.c' } }),
    ).toEqual({ url: '/v1/auth/login', body: { email: 'a@b.c' } });
  });
});

describe('buildRequestBody', () => {
  it('stringifies JSON-like bodies for non-GET', () => {
    expect(buildRequestBody('POST', { a: 1 })).toBe('{"a":1}');
  });

  it('returns FormData as-is', () => {
    const fd = new FormData();
    expect(buildRequestBody('POST', fd)).toBe(fd);
  });
});

describe('shouldRetry — number form (legacy)', () => {
  const empty = new Map<number, number>();

  it('retries within budget on retriable HTTP', () => {
    expect(shouldRetry(3, 503, 0, empty)).toBe(true);
    expect(shouldRetry(3, 429, 0, empty)).toBe(true);
    expect(shouldRetry(3, 408, 0, empty)).toBe(true);
  });

  it('treats status=0 (throws/aborts) as retriable', () => {
    expect(shouldRetry(2, 0, 0, empty)).toBe(true);
    expect(shouldRetry(2, 0, 1, empty)).toBe(true);
    expect(shouldRetry(2, 0, 2, empty)).toBe(false);
  });

  it('does not retry on non-retriable HTTP regardless of budget', () => {
    expect(shouldRetry(5, 404, 0, empty)).toBe(false);
    expect(shouldRetry(5, 401, 0, empty)).toBe(false);
    expect(shouldRetry(5, 400, 0, empty)).toBe(false);
  });

  it('honors the total cap', () => {
    expect(shouldRetry(2, 503, 1, empty)).toBe(true);
    expect(shouldRetry(2, 503, 2, empty)).toBe(false);
  });

  it('returns false when retries is 0 or undefined', () => {
    expect(shouldRetry(0, 503, 0, empty)).toBe(false);
    expect(shouldRetry(undefined, 503, 0, empty)).toBe(false);
  });
});

describe('shouldRetry — record form (per-status budgets)', () => {
  it('retries up to the per-status budget', () => {
    const used = new Map<number, number>();
    expect(shouldRetry({ 503: 2 }, 503, 0, used)).toBe(true);
    used.set(503, 1);
    expect(shouldRetry({ 503: 2 }, 503, 1, used)).toBe(true);
    used.set(503, 2);
    expect(shouldRetry({ 503: 2 }, 503, 2, used)).toBe(false);
  });

  it('is exhaustive — statuses not in the map get 0', () => {
    const used = new Map<number, number>();
    expect(shouldRetry({ 503: 3 }, 500, 0, used)).toBe(false);
    expect(shouldRetry({ 503: 3 }, 429, 0, used)).toBe(false);
    expect(shouldRetry({ 503: 3 }, 401, 0, used)).toBe(false);
  });

  it('throws/aborts need explicit `0: N` budget in record form', () => {
    const used = new Map<number, number>();
    expect(shouldRetry({ 503: 3 }, 0, 0, used)).toBe(false);
    expect(shouldRetry({ 0: 2, 503: 3 }, 0, 0, used)).toBe(true);
  });

  it('allows mixed budgets, tracked independently', () => {
    const used = new Map<number, number>();
    expect(shouldRetry({ 401: 1, 503: 3 }, 401, 0, used)).toBe(true);
    used.set(401, 1);
    expect(shouldRetry({ 401: 1, 503: 3 }, 401, 1, used)).toBe(false);
    expect(shouldRetry({ 401: 1, 503: 3 }, 503, 1, used)).toBe(true);
  });
});

describe('applyTimeout', () => {
  it('returns the original signal when timeoutMs is undefined', () => {
    const external = new AbortController().signal;
    const { signal, cleanup } = applyTimeout(external, undefined);
    expect(signal).toBe(external);
    cleanup();
  });

  it('aborts the merged signal after timeoutMs', async () => {
    vi.useFakeTimers();
    const { signal, cleanup } = applyTimeout(undefined, 100);
    expect(signal!.aborted).toBe(false);
    vi.advanceTimersByTime(100);
    expect(signal!.aborted).toBe(true);
    cleanup();
    vi.useRealTimers();
  });

  it('propagates external abort to the merged signal', () => {
    const ctrl = new AbortController();
    const { signal, cleanup } = applyTimeout(ctrl.signal, 1000);
    expect(signal!.aborted).toBe(false);
    ctrl.abort();
    expect(signal!.aborted).toBe(true);
    cleanup();
  });

  it('cleanup clears the pending timer', async () => {
    vi.useFakeTimers();
    const { signal, cleanup } = applyTimeout(undefined, 100);
    cleanup();
    vi.advanceTimersByTime(200);
    expect(signal!.aborted).toBe(false);
    vi.useRealTimers();
  });
});

describe('joinResponses', () => {
  it('merges loading and data', () => {
    const out = joinResponses(
      { status: HttpCode.OK, data: { a: 1 }, loading: false },
      { status: HttpCode.OK, data: { b: 2 }, loading: true },
    );
    expect(out.loading).toBe(true);
    expect(out.data).toEqual({ a: 1, b: 2 });
  });
});
