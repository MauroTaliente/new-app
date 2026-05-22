import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBearerStaticSessionManager } from '../src/bearer-static-session';

type Tokens = { access_token: string };

const farFuture = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MjAwMDAwMDAwMH0.x';
const expired = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MX0.x';
const selectors = { selectAccessToken: (t: Tokens) => t.access_token };

let managers: { dispose: () => void }[] = [];
function track<T extends { dispose: () => void }>(m: T): T {
  managers.push(m);
  return m;
}

describe('createBearerStaticSessionManager', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    managers = [];
  });

  afterEach(() => {
    managers.forEach((m) => m.dispose());
  });

  it('setSession holds the access token in memory by default (nothing persisted)', () => {
    const mgr = track(createBearerStaticSessionManager<Tokens>({ selectors }));
    mgr.setSession({ access_token: farFuture });
    expect(mgr.getAccessToken()).toBe(farFuture);
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('clearSession wipes the token', () => {
    const mgr = track(createBearerStaticSessionManager<Tokens>({ selectors }));
    mgr.setSession({ access_token: farFuture });
    mgr.clearSession();
    expect(mgr.getAccessToken()).toBeNull();
  });

  it('setSession throws when selectAccessToken returns an empty value', () => {
    const mgr = track(
      createBearerStaticSessionManager<Tokens>({ selectors: { selectAccessToken: () => '' } }),
    );
    expect(() => mgr.setSession({ access_token: 'x' })).toThrow(
      /selectAccessToken returned an empty value/,
    );
  });

  it('isAccessTokenExpired honors the JWT exp and a custom skew', () => {
    const mgr = track(createBearerStaticSessionManager<Tokens>({ selectors }));
    mgr.setSession({ access_token: expired });
    expect(mgr.isAccessTokenExpired()).toBe(true);
    mgr.setSession({ access_token: farFuture });
    expect(mgr.isAccessTokenExpired()).toBe(false);
    expect(mgr.isAccessTokenExpired(1e10)).toBe(true);
  });

  it('decodeAccessPayload reads JWT claims', () => {
    const mgr = track(createBearerStaticSessionManager<Tokens>({ selectors }));
    mgr.setSession({ access_token: farFuture });
    expect(mgr.decodeAccessPayload()?.sub).toBe('u1');
  });

  it('getSnapshot returns { hasAccess, accessPayload } with stable identity', () => {
    const mgr = track(createBearerStaticSessionManager<Tokens>({ selectors }));
    expect(mgr.getSnapshot()).toEqual({ hasAccess: false, accessPayload: null });

    mgr.setSession({ access_token: farFuture });
    const snap = mgr.getSnapshot();
    expect(snap.hasAccess).toBe(true);
    expect(snap.accessPayload?.sub).toBe('u1');
    expect(mgr.getSnapshot()).toBe(snap); // reference-stable when nothing changed
  });

  it('subscribe fires on setSession and clearSession', () => {
    const mgr = track(createBearerStaticSessionManager<Tokens>({ selectors }));
    const listener = vi.fn();
    mgr.subscribe(listener);
    mgr.setSession({ access_token: farFuture });
    expect(listener).toHaveBeenCalledTimes(1);
    mgr.clearSession();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('requires storageKey when storage is not "memory"', () => {
    expect(() =>
      createBearerStaticSessionManager<Tokens>({ selectors, storage: 'localStorage' }),
    ).toThrow(/storageKey is required/);
  });

  it('persists to sessionStorage — a fresh manager hydrates from it', () => {
    track(
      createBearerStaticSessionManager<Tokens>({
        selectors,
        storage: 'sessionStorage',
        storageKey: 'static.tok',
      }),
    ).setSession({ access_token: farFuture });

    const fresh = track(
      createBearerStaticSessionManager<Tokens>({
        selectors,
        storage: 'sessionStorage',
        storageKey: 'static.tok',
      }),
    );
    expect(fresh.getAccessToken()).toBe(farFuture);
    expect(fresh.getSnapshot().hasAccess).toBe(true);
  });

  it('syncs cross-tab on a storage event (localStorage)', () => {
    const mgr = track(
      createBearerStaticSessionManager<Tokens>({
        selectors,
        storage: 'localStorage',
        storageKey: 'static.cross',
      }),
    );
    mgr.setSession({ access_token: farFuture });
    expect(mgr.getAccessToken()).toBe(farFuture);

    window.localStorage.removeItem('static.cross');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'static.cross',
        oldValue: farFuture,
        newValue: null,
        storageArea: window.localStorage,
      }),
    );
    expect(mgr.getAccessToken()).toBeNull();
    expect(mgr.getSnapshot().hasAccess).toBe(false);
  });
});
