import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLocalePersistence } from './locale-persistence.js';

describe('createLocalePersistence', () => {
  beforeEach(() => {
    document.cookie = '';
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = '';
    localStorage.clear();
  });

  it('uses cookie backend when persistenceMode is cookie', () => {
    const p = createLocalePersistence({
      defaultLocale: 'es',
      allowedLocales: ['es', 'en'],
      persistenceMode: 'cookie',
      cookieName: 'app-locale',
    });
    expect(p.persistenceMode).toBe('cookie');
    p.persistLocale('en');
    expect(document.cookie).toContain('app-locale=en');
    expect(p.getInitialLocale({ pathname: '/' })).toBe('en');
  });

  it('uses localStorage when persistenceMode is localStorage', () => {
    const p = createLocalePersistence({
      defaultLocale: 'es',
      allowedLocales: ['es', 'en'],
      persistenceMode: 'localStorage',
      localStorageKey: 'lang',
    });
    p.persistLocale('en');
    expect(localStorage.getItem('lang')).toBeTruthy();
    expect(p.getInitialLocale({ pathname: '/' })).toBe('en');
  });

  it('persistenceEnvKey overrides persistenceMode', () => {
    const p = createLocalePersistence({
      defaultLocale: 'es',
      allowedLocales: ['es', 'en'],
      persistenceMode: 'cookie',
      cookieName: 'loc',
      persistenceEnvKey: 'APP_LOCALE_PERSISTENCE',
      env: { APP_LOCALE_PERSISTENCE: 'localStorage' },
      localStorageKey: 'loc',
    });
    expect(p.persistenceMode).toBe('localStorage');
    p.persistLocale('en');
    expect(p.getInitialLocale({ pathname: '/' })).toBe('en');
    expect(document.cookie).not.toContain('loc=');
  });

  it('buildResolveOptions only includes active backend keys', () => {
    const cookie = createLocalePersistence({
      defaultLocale: 'es',
      allowedLocales: ['es'],
      persistenceMode: 'cookie',
      cookieName: 'c',
      localStorageKey: 's',
    });
    expect(cookie.buildResolveOptions()).toEqual({
      defaultLocale: 'es',
      allowedLocales: ['es'],
      cookieName: 'c',
    });

    const ls = createLocalePersistence({
      defaultLocale: 'es',
      allowedLocales: ['es'],
      persistenceMode: 'localStorage',
      cookieName: 'c',
      localStorageKey: 's',
    });
    expect(ls.buildResolveOptions()).toEqual({
      defaultLocale: 'es',
      allowedLocales: ['es'],
      localStorageKey: 's',
    });
  });
});
