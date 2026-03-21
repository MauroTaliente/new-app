import { describe, it, expect, expectTypeOf, vi, afterEach } from 'vitest';
import {
  createApiRegistry,
  mergeRequestProps,
  buildHeadersFromTokenTemplate,
  assertValidApiName,
} from '../src/api-registry.js';
import type { Request } from '../src/types/models.js';
import type { ApiClientConfigBody } from '../src/types/api-registry.js';
import type { RequestProps } from '../src/types/models.js';

describe('buildHeadersFromTokenTemplate', () => {
  it('replaces token placeholder', () => {
    expect(
      buildHeadersFromTokenTemplate('abc', {
        Authorization: 'Bearer {token}',
        'X-Key': '{token}',
      }),
    ).toEqual({
      Authorization: 'Bearer abc',
      'X-Key': 'abc',
    });
  });
});

describe('mergeRequestProps', () => {
  it('merges headers with patch winning on same key', () => {
    const base: RequestProps = {
      url: 'https://x.test',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    };
    const merged = mergeRequestProps(base, { headers: { Authorization: 'Bearer t' } });
    expect(merged.headers).toBeDefined();
    const h = new Headers(merged.headers as HeadersInit);
    expect(h.get('Accept')).toBe('application/json');
    expect(h.get('Authorization')).toBe('Bearer t');
  });
});

describe('assertValidApiName', () => {
  it('accepts valid identifiers', () => {
    expect(() => assertValidApiName('admin')).not.toThrow();
    expect(() => assertValidApiName('api_1')).not.toThrow();
  });

  it('rejects invalid names', () => {
    expect(() => assertValidApiName('1bad')).toThrow();
    expect(() => assertValidApiName('a-b')).toThrow();
  });
});

describe('createApiRegistry', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('creates one client per entry with merged URL', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch;

    const apis = createApiRegistry(
      [
        { name: 'alpha', url: 'https://alpha.test', headers: { Accept: 'application/json' } },
        { name: 'beta', url: 'https://beta.test' },
      ],
      {
        load: async (shared) => ({
          ...shared,
          headers: { ...new Headers(shared.headers as HeadersInit), 'X-Test': '1' } as RequestProps['headers'],
        }),
      },
    );

    await apis.alpha({ url: '/v1', method: 'GET' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(calledUrl)).toContain('alpha.test');
    expect(String(calledUrl)).toContain('/v1');

    await apis.beta({ url: '/x', method: 'GET' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('uses per-name load from loads when provided', async () => {
    const loadA = vi.fn(async (s: RequestProps) => ({ ...s, headers: { 'X-A': '1' } }));
    const loadB = vi.fn(async (s: RequestProps) => ({ ...s, headers: { 'X-B': '2' } }));

    globalThis.fetch = vi.fn(async () =>
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    ) as typeof fetch;

    const apis = createApiRegistry(
      [{ name: 'a', url: 'https://a.test' }, { name: 'b', url: 'https://b.test' }],
      { loads: { a: loadA, b: loadB } },
    );

    await apis.a({ method: 'GET' });
    expect(loadA).toHaveBeenCalled();
    await apis.b({ method: 'GET' });
    expect(loadB).toHaveBeenCalled();
  });

  it('throws on duplicate names', () => {
    expect(() =>
      createApiRegistry([
        { name: 'dup', url: 'https://a.test' },
        { name: 'dup', url: 'https://b.test' },
      ]),
    ).toThrow(/Duplicate api name/);
  });

  it('map form with satisfies infers literal API keys', () => {
    const definitions = {
      pokemon: { url: 'https://poke.test', cache: 'no-store' as const },
    } satisfies Record<string, ApiClientConfigBody>;
    const apis = createApiRegistry(definitions, { load: async (s) => s });
    expectTypeOf(apis).toEqualTypeOf<{ pokemon: Request<unknown, unknown> }>();
  });

  it('accepts map form (keys are API names)', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch;

    const apis = createApiRegistry(
      {
        alpha: { url: 'https://alpha.test', headers: { Accept: 'application/json' } },
        beta: { url: 'https://beta.test' },
      },
      {
        load: async (shared) => ({
          ...shared,
          headers: { ...new Headers(shared.headers as HeadersInit), 'X-Test': '1' } as RequestProps['headers'],
        }),
      },
    );

    await apis.alpha({ url: '/v1', method: 'GET' });
    expect(String((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain(
      'alpha.test',
    );
  });
});
