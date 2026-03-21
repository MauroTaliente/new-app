import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeLocaleTag, resolveInitialLocale } from './browser.js';

describe('normalizeLocaleTag', () => {
  it('matches exact and short codes', () => {
    const allowed = ['es', 'en'] as const;
    expect(normalizeLocaleTag('es', allowed)).toBe('es');
    expect(normalizeLocaleTag('es-AR', allowed)).toBe('es');
    expect(normalizeLocaleTag('en-US', allowed)).toBe('en');
    expect(normalizeLocaleTag('fr', allowed)).toBeUndefined();
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
});
