import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBearerSessionManager } from '../src/bearer-session';
import { createBearerSessionLoad } from '../src/bearer-session-load';

type Tokens = { access_token: string; refresh_token: string };

/** Payload `{"sub":"u1","exp":2000000000}` — far in the future, never expires in the test window. */
const farFuture =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MjAwMDAwMDAwMH0.x';

/** Payload `{"sub":"u1","exp":1}` — far in the past, always expired. */
const expired =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MX0.x';

function makeSession(
  refresh: (rt: string) => Promise<Tokens | null> = async () => null,
) {
  return createBearerSessionManager<Tokens>({
    storageKey: 'test.session',
    selectors: {
      selectAccessToken: (t) => t.access_token,
      selectRefreshToken: (t) => t.refresh_token,
    },
    refresh,
  });
}

function getHeader(merged: { headers?: HeadersInit }, name: string): string | null {
  return new Headers(merged.headers).get(name);
}

describe('createBearerSessionLoad', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('adds Authorization header when access token is fresh; does NOT call refresh', async () => {
    const refresh = vi.fn(async () => null);
    const session = makeSession(refresh);
    session.setSession({ access_token: farFuture, refresh_token: 'rt1' });

    const load = createBearerSessionLoad(session);
    const merged = await load({
      url: 'https://api.test/x',
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    expect(getHeader(merged, 'Authorization')).toBe(`Bearer ${farFuture}`);
    expect(getHeader(merged, 'Accept')).toBe('application/json');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes proactively when access is expired and refresh token exists; uses new access in header', async () => {
    const refresh = vi.fn(async () => ({
      access_token: farFuture,
      refresh_token: 'rt2',
    }));
    const session = makeSession(refresh);
    session.setSession({ access_token: expired, refresh_token: 'rt1' });

    const load = createBearerSessionLoad(session);
    const merged = await load({ url: 'https://api.test/x', method: 'GET' });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(getHeader(merged, 'Authorization')).toBe(`Bearer ${farFuture}`);
  });

  it('returns shared unchanged when there is no access and no refresh token', async () => {
    const refresh = vi.fn(async () => null);
    const session = makeSession(refresh);
    // No setSession — both tokens absent.

    const load = createBearerSessionLoad(session);
    const shared = { url: 'https://api.test/x', method: 'GET' as const };
    const out = await load(shared);

    expect(refresh).not.toHaveBeenCalled();
    expect(out).toEqual(shared);
  });

  it('proactiveRefresh:false skips refresh entirely and attaches whatever access is in memory', async () => {
    const refresh = vi.fn(async () => null);
    const session = makeSession(refresh);
    session.setSession({ access_token: expired, refresh_token: 'rt1' });

    const load = createBearerSessionLoad(session, { proactiveRefresh: false });
    const merged = await load({ url: 'https://api.test/x', method: 'GET' });

    expect(refresh).not.toHaveBeenCalled();
    expect(getHeader(merged, 'Authorization')).toBe(`Bearer ${expired}`);
  });

  it('parallel loads with expired access coalesce into a single refresh (single-flight)', async () => {
    const refresh = vi.fn(async () => ({
      access_token: farFuture,
      refresh_token: 'rt2',
    }));
    const session = makeSession(refresh);
    session.setSession({ access_token: expired, refresh_token: 'rt1' });

    const load = createBearerSessionLoad(session);

    const [a, b, c] = await Promise.all([
      load({ url: 'https://api.test/x', method: 'GET' }),
      load({ url: 'https://api.test/y', method: 'GET' }),
      load({ url: 'https://api.test/z', method: 'GET' }),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(getHeader(a, 'Authorization')).toBe(`Bearer ${farFuture}`);
    expect(getHeader(b, 'Authorization')).toBe(`Bearer ${farFuture}`);
    expect(getHeader(c, 'Authorization')).toBe(`Bearer ${farFuture}`);
  });

  it('renders custom header template — multiple {token} occurrences across headers', async () => {
    const session = makeSession();
    session.setSession({ access_token: farFuture, refresh_token: 'rt1' });

    const load = createBearerSessionLoad(session, {
      headers: {
        Authorization: 'Bearer {token}',
        'X-Token': '{token}',
        'X-Composite': 'prefix-{token}-and-{token}-suffix',
      },
    });

    const merged = await load({ url: 'https://api.test/x', method: 'GET' });

    expect(getHeader(merged, 'Authorization')).toBe(`Bearer ${farFuture}`);
    expect(getHeader(merged, 'X-Token')).toBe(farFuture);
    expect(getHeader(merged, 'X-Composite')).toBe(
      `prefix-${farFuture}-and-${farFuture}-suffix`,
    );
  });
});
