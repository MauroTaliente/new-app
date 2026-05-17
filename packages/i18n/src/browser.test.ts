import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeLocaleTag, resolveInitialLocale } from './browser.js';

describe('normalizeLocaleTag', () => {
  it('matches exact and short codes', () => {
    const allowed = ['es', 'en'] as const;
    expect(normalizeLocaleTag('es', allowed)).toBe('es');
    expect(normalizeLocaleTag('es-AR', allowed)).toBe('es');
    expect(normalizeLocaleTag('en_US', allowed)).toBe('en');
    expect(normalizeLocaleTag('fr', allowed)).toBeUndefined();
    expect(normalizeLocaleTag(undefined, allowed)).toBeUndefined();
    expect(normalizeLocaleTag('  es  ', allowed)).toBe('es');
  });
});

describe('resolveInitialLocale', () => {
  const base = { defaultLocale: 'es', allowedLocales: ['es', 'en'] as const };

  beforeEach(() => {
    localStorage.clear();
  });

  it('uses pathname first segment', () => {
    expect(resolveInitialLocale({ ...base, pathname: '/en/about' })).toBe('en');
  });

  it('uses regex first capture as locale', () => {
    expect(
      resolveInitialLocale({
        ...base,
        pathname: '/en/dashboard',
        urlLocalePattern: /^\/([a-z]{2})(?:\/|$)/,
      }),
    ).toBe('en');
  });

  it('uses cookieHeader', () => {
    expect(
      resolveInitialLocale({
        ...base,
        cookieName: 'locale',
        cookieHeader: 'locale=en; other=1',
      }),
    ).toBe('en');
  });

  it('lee document.cookie cuando no hay cookieHeader', () => {
    document.cookie = 'locale=en; path=/';
    expect(
      resolveInitialLocale({
        ...base,
        cookieName: 'locale',
      }),
    ).toBe('en');
    document.cookie = 'locale=; Max-Age=0; path=/';
  });

  it('uses localStorage', () => {
    localStorage.setItem('locale', 'en');
    expect(
      resolveInitialLocale({
        ...base,
        localStorageKey: 'locale',
      }),
    ).toBe('en');
  });

  it('uses navigatorLanguage', () => {
    expect(resolveInitialLocale({ ...base, navigatorLanguage: 'en-US' })).toBe('en');
  });

  it('falls back to default', () => {
    expect(resolveInitialLocale({ ...base, navigatorLanguage: 'de-DE' })).toBe('es');
  });

  it('usa navigator.language cuando no hay override', () => {
    const prev = navigator.language;
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'en-US' });
    expect(resolveInitialLocale({ ...base })).toBe('en');
    Object.defineProperty(navigator, 'language', { configurable: true, value: prev });
  });

  it('ignora localStorage si getItem lanza (modo privado)', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(
      resolveInitialLocale({
        ...base,
        localStorageKey: 'locale',
        navigatorLanguage: 'de-DE',
      }),
    ).toBe('es');
    getItem.mockRestore();
  });

  it('cookie sin document usa header vacío', () => {
    const doc = globalThis.document;
    // @ts-expect-error — entorno sin DOM
    delete globalThis.document;
    expect(
      resolveInitialLocale({
        ...base,
        cookieName: 'locale',
        navigatorLanguage: 'en-US',
      }),
    ).toBe('en');
    globalThis.document = doc;
  });

  it('sin navigator usa defaultLocale', () => {
    const nav = globalThis.navigator;
    // @ts-expect-error — entorno sin navigator
    delete globalThis.navigator;
    expect(resolveInitialLocale({ ...base })).toBe('es');
    globalThis.navigator = nav;
  });

  it('pathname con regex sin match sigue la cadena de fallback', () => {
    expect(
      resolveInitialLocale({
        ...base,
        pathname: '/dashboard',
        urlLocalePattern: /^\/([a-z]{2})\//,
        navigatorLanguage: 'en-US',
      }),
    ).toBe('en');
  });
});
