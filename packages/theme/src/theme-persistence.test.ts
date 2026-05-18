import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createThemePersistence } from './theme-persistence.js';

describe('createThemePersistence', () => {
  beforeEach(() => {
    document.cookie = '';
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = '';
    localStorage.clear();
  });

  it('reads and writes cookie mode', () => {
    const p = createThemePersistence({
      defaultTheme: 'light',
      persistenceMode: 'cookie',
      cookieName: 'demo-theme',
    });
    p.persistTheme('dark');
    expect(document.cookie).toContain('demo-theme=dark');
    expect(p.getInitialTheme()).toBe('dark');
  });

  it('reads and writes localStorage mode', () => {
    const p = createThemePersistence({
      defaultTheme: 'light',
      persistenceMode: 'localStorage',
      localStorageKey: 'theme',
    });
    p.persistTheme('dark');
    expect(p.getInitialTheme()).toBe('dark');
  });
});
