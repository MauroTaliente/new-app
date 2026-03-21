import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRequestCacheKey, createRequestCache } from '../src/cache/request-cache.js';

describe('buildRequestCacheKey', () => {
  it('is stable for object key order', () => {
    const a = buildRequestCacheKey('api', { z: 1, a: 2 });
    const b = buildRequestCacheKey('api', { a: 2, z: 1 });
    expect(a).toBe(b);
  });

  it('includes scope when provided', () => {
    expect(buildRequestCacheKey('api', { x: 1 }, 's1')).not.toBe(
      buildRequestCacheKey('api', { x: 1 }, 's2'),
    );
  });
});

describe('createRequestCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('dedupes in-flight requests with same key', async () => {
    const cache = createRequestCache();
    let calls = 0;
    const slow = () =>
      new Promise<string>((resolve) => {
        calls += 1;
        setTimeout(() => resolve('ok'), 100);
      });

    const k = 'k1';
    const p1 = cache.run(k, undefined, () => slow());
    const p2 = cache.run(k, undefined, () => slow());
    vi.advanceTimersByTime(100);
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('ok');
    expect(r2).toBe('ok');
    expect(calls).toBe(1);
  });

  it('stores successful RequestReturn when ttl > 0', async () => {
    const cache = createRequestCache();
    const k = 'k2';
    let calls = 0;
    const action = () => {
      calls += 1;
      return Promise.resolve({ status: 200, data: { n: calls } });
    };

    const r1 = await cache.run(k, 60_000, action);
    expect((r1 as { data: { n: number } }).data.n).toBe(1);

    vi.advanceTimersByTime(10_000);
    const r2 = await cache.run(k, 60_000, action);
    expect((r2 as { data: { n: number } }).data.n).toBe(1);
    expect(calls).toBe(1);
  });

  it('does not cache non-2xx responses', async () => {
    const cache = createRequestCache();
    const k = 'k3';
    let calls = 0;
    const action = () => {
      calls += 1;
      return Promise.resolve({ status: 500, data: {} });
    };

    await cache.run(k, 60_000, action);
    await cache.run(k, 60_000, action);
    expect(calls).toBe(2);
  });

  it('invalidate clears memory for key', async () => {
    const cache = createRequestCache();
    const k = 'k4';
    await cache.run(k, 60_000, () => Promise.resolve({ status: 200, data: 1 }));
    cache.invalidate(k);
    let calls = 0;
    await cache.run(k, 60_000, () => {
      calls += 1;
      return Promise.resolve({ status: 200, data: 2 });
    });
    expect(calls).toBe(1);
  });
});
