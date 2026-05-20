import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBearerSessionManager } from '../src/bearer-session';

type Tokens = { access_token: string; refresh_token: string };

const farFuture =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MjAwMDAwMDAwMH0.x';

const expired =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MX0.x';

const baseSelectors = {
  selectAccessToken: (t: Tokens) => t.access_token,
  selectRefreshToken: (t: Tokens) => t.refresh_token,
};

let managers: { dispose: () => void }[] = [];
function track<T extends { dispose: () => void }>(mgr: T): T {
  managers.push(mgr);
  return mgr;
}

describe('createBearerSessionManager', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    managers = [];
  });

  afterEach(() => {
    managers.forEach((m) => m.dispose());
  });

  it('setSession stores access in memory and refresh in sessionStorage', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    expect(mgr.getAccessToken()).toBe(farFuture);
    expect(sessionStorage.getItem('test.session')).toBeTruthy();
    expect(mgr.hasRefreshToken()).toBe(true);
  });

  it('clearSession wipes memory and storage', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    mgr.clearSession();
    expect(mgr.getAccessToken()).toBeNull();
    expect(mgr.hasRefreshToken()).toBe(false);
  });

  it('ensureFreshSession coalesces parallel refresh calls', async () => {
    const refresh = vi.fn(async () => ({
      access_token: farFuture,
      refresh_token: 'rt2',
    }));
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: baseSelectors,
        refresh,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });

    const [a, b] = await Promise.all([
      mgr.ensureFreshSession(),
      mgr.ensureFreshSession(),
    ]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('decodeAccessPayload reads JWT claims', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    expect(mgr.decodeAccessPayload()?.sub).toBe('u1');
  });

  // ---------- Failure paths ----------

  it('ensureFreshSession with refresh→null clears the session and returns false', async () => {
    const refresh = vi.fn(async () => null);
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: baseSelectors,
        refresh,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });

    const ok = await mgr.ensureFreshSession();
    expect(ok).toBe(false);
    expect(mgr.getAccessToken()).toBeNull();
    expect(mgr.hasRefreshToken()).toBe(false);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('ensureFreshSession with refresh throwing clears the session and returns false', async () => {
    const refresh = vi.fn(async () => {
      throw new Error('network down');
    });
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: baseSelectors,
        refresh,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });

    const ok = await mgr.ensureFreshSession();
    expect(ok).toBe(false);
    expect(mgr.getAccessToken()).toBeNull();
    expect(mgr.hasRefreshToken()).toBe(false);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('ensureFreshSession without a refresh token returns false without calling refresh', async () => {
    const refresh = vi.fn(async () => null);
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: baseSelectors,
        refresh,
      }),
    );
    // No setSession.

    const ok = await mgr.ensureFreshSession();
    expect(ok).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('setSession throws when selectRefreshToken returns an empty string', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: {
          selectAccessToken: (t) => t.access_token,
          selectRefreshToken: () => '',
        },
        refresh: async () => null,
      }),
    );
    expect(() =>
      mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' }),
    ).toThrow(/selectRefreshToken returned an empty value/);
  });

  it('isAccessTokenExpired honors a custom skew', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'test.session',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    mgr.setSession({ access_token: expired, refresh_token: 'rt1' });
    expect(mgr.isAccessTokenExpired()).toBe(true);
    expect(mgr.isAccessTokenExpired(0)).toBe(true); // long-expired regardless of skew

    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    expect(mgr.isAccessTokenExpired()).toBe(false);
    // Skew = 1e10 seconds in the future → treats far-future token as expired.
    expect(mgr.isAccessTokenExpired(1e10)).toBe(true);
  });

  // ---------- Cross-tab + dispose ----------

  it('cross-tab clear (storage event with newValue=null) invalidates in-memory access', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'cross.session',
        storage: 'localStorage',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    expect(mgr.getAccessToken()).toBe(farFuture);

    // Simulate another tab clearing the refresh key: the OTHER tab calls removeItem on its
    // localStorage (same origin → same Storage object), which fires the `storage` event in
    // THIS tab. We mirror both effects: the actual removal AND the event dispatch.
    window.localStorage.removeItem('cross.session');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'cross.session',
        oldValue: 'rt1',
        newValue: null,
        storageArea: window.localStorage,
      }),
    );

    expect(mgr.getAccessToken()).toBeNull();
    expect(mgr.hasRefreshToken()).toBe(false);
    expect(mgr.decodeAccessPayload()).toBeNull();
  });

  // ---------- subscribe / getSnapshot ----------

  it('getSnapshot returns reactive shape (hasAccess/hasRefresh/accessPayload)', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'snap.session',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    expect(mgr.getSnapshot()).toEqual({
      hasAccess: false,
      hasRefresh: false,
      accessPayload: null,
    });

    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    const snap = mgr.getSnapshot();
    expect(snap.hasAccess).toBe(true);
    expect(snap.hasRefresh).toBe(true);
    expect(snap.accessPayload?.sub).toBe('u1');
  });

  it('getSnapshot returns the SAME reference when nothing changed (useSyncExternalStore contract)', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'snap-id.session',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    const a = mgr.getSnapshot();
    const b = mgr.getSnapshot();
    expect(a).toBe(b);
  });

  it('subscribe is fired on setSession and clearSession', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'sub.session',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    const listener = vi.fn();
    const unsub = mgr.subscribe(listener);
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    expect(listener).toHaveBeenCalledTimes(1);
    mgr.clearSession();
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt2' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('subscribe is fired on cross-tab storage change', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'sub-cross.session',
        storage: 'localStorage',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    const listener = vi.fn();
    mgr.subscribe(listener);

    window.localStorage.removeItem('sub-cross.session');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'sub-cross.session',
        oldValue: 'rt1',
        newValue: null,
        storageArea: window.localStorage,
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('subscribe does NOT fire when state is unchanged (clearSession on empty session)', () => {
    const mgr = track(
      createBearerSessionManager<Tokens>({
        storageKey: 'sub-noop.session',
        selectors: baseSelectors,
        refresh: async () => null,
      }),
    );
    const listener = vi.fn();
    mgr.subscribe(listener);
    mgr.clearSession();
    expect(listener).not.toHaveBeenCalled();
  });

  it('dispose detaches the cross-tab subscriber', () => {
    const mgr = createBearerSessionManager<Tokens>({
      storageKey: 'disp.session',
      storage: 'localStorage',
      selectors: baseSelectors,
      refresh: async () => null,
    });
    mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' });

    mgr.dispose();

    // After dispose, storage events MUST NOT affect the manager any more.
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'disp.session',
        oldValue: 'rt1',
        newValue: null,
        storageArea: window.localStorage,
      }),
    );

    expect(mgr.getAccessToken()).toBe(farFuture);
  });
});
