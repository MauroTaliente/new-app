import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLoadRequestPropsFromAuthProfile,
  createLoadRequestPropsFromAuthProfiles,
} from '../src/http-auth-load.js';
import { setLocalStorage } from '../src/storage.js';

describe('createLoadRequestPropsFromAuthProfile', () => {
  beforeEach(() => {
    document.cookie = '';
    localStorage.clear();
    sessionStorage.clear();
  });

  it('merges Bearer header from cookie', async () => {
    document.cookie = 'session_tok=myjwt; path=/';

    const load = createLoadRequestPropsFromAuthProfile({
      storage: 'cookie',
      key: 'session_tok',
      headers: { Authorization: 'Bearer {token}' },
    });

    const merged = await load({
      url: 'https://api.test/x',
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const h = new Headers(merged.headers as HeadersInit);
    expect(h.get('Authorization')).toBe('Bearer myjwt');
    expect(h.get('Accept')).toBe('application/json');
  });

  it('reads token from localStorage', async () => {
    setLocalStorage({ name: 'tok_a', params: 'secret' });

    const load = createLoadRequestPropsFromAuthProfile({
      storage: 'localStorage',
      key: 'tok_a',
      headers: { 'X-Api-Key': '{token}' },
    });

    const merged = await load({ url: 'https://x.test', method: 'GET' });
    const h = new Headers(merged.headers as HeadersInit);
    expect(h.get('X-Api-Key')).toBe('secret');
  });

  it('returns shared unchanged when token missing', async () => {
    const load = createLoadRequestPropsFromAuthProfile({
      storage: 'cookie',
      key: 'missing',
      headers: { Authorization: 'Bearer {token}' },
    });

    const shared = { url: 'https://x.test', method: 'GET' as const };
    const out = await load(shared);
    expect(out).toEqual(shared);
  });
});

describe('createLoadRequestPropsFromAuthProfiles', () => {
  it('builds a map of loaders', () => {
    const map = createLoadRequestPropsFromAuthProfiles({
      p1: { storage: 'cookie', key: 'a', headers: { Authorization: 'Bearer {token}' } },
    });
    expect(typeof map.p1).toBe('function');
  });
});
