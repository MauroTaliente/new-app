import { describe, it, expect } from 'vitest';
import type { CookieStoreLike } from '../src/cookie-store.js';
import {
  getCookieFromStore,
  putCookieInStore,
  setCookieInStore,
} from '../src/cookie-store.js';

function createMemoryStore(): CookieStoreLike {
  const jar = new Map<string, string>();
  return {
    get: (name) => {
      const value = jar.get(name);
      return value === undefined ? undefined : { value };
    },
    set: (name, value) => {
      jar.set(name, value);
    },
  };
}

describe('cookie store api', () => {
  it('reads JSON from the store with initData merge', () => {
    const store = createMemoryStore();
    store.set('prefs', JSON.stringify({ theme: 'dark' }));
    expect(getCookieFromStore(store, { name: 'prefs', initData: { lang: 'es' } })).toEqual({
      lang: 'es',
      theme: 'dark',
    });
  });

  it('writes via setCookieInStore', () => {
    const store = createMemoryStore();
    setCookieInStore(store, { name: 'token', params: 'abc' });
    expect(store.get('token')?.value).toBe('abc');
  });

  it('merges via putCookieInStore', () => {
    const store = createMemoryStore();
    setCookieInStore(store, { name: 'prefs', params: { a: 1 } });
    putCookieInStore(store, { name: 'prefs', initData: {}, params: { b: 2 } });
    expect(getCookieFromStore(store, { name: 'prefs', initData: {} })).toEqual({ a: 1, b: 2 });
  });
});
