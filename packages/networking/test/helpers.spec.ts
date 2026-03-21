import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldRetryAfterHttpFailure,
  sleepMs,
  buildRequestUrl,
  buildRequestBody,
  joinResponses,
} from '../src/helpers.js';
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

describe('buildRequestBody', () => {
  it('stringifies JSON-like bodies for non-GET', () => {
    expect(buildRequestBody('POST', { a: 1 })).toBe('{"a":1}');
  });

  it('returns FormData as-is', () => {
    const fd = new FormData();
    expect(buildRequestBody('POST', fd)).toBe(fd);
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
