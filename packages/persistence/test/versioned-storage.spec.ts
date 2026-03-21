import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createVersionedStorageApi } from '../src/versioned-storage.js';

describe('createVersionedStorageApi', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes and reads envelope at currentVersion', () => {
    const api = createVersionedStorageApi(localStorage, {
      currentVersion: 1,
      migrations: {
        0: (prev) => prev,
      },
    });

    api.setLocal({ name: 'k', params: { a: 1 } });
    const raw = localStorage.getItem('k');
    expect(JSON.parse(raw!)).toEqual({ _v: 1, data: { a: 1 } });
    expect(api.getLocal({ name: 'k', initData: { a: 0 } })).toEqual({ a: 1 });
  });

  it('migrates legacy plain object (v0) through two steps', () => {
    localStorage.setItem('prefs', JSON.stringify({ theme: 'dark' }));

    const api = createVersionedStorageApi(localStorage, {
      currentVersion: 2,
      migrations: {
        0: (prev) => ({ ...(prev as object), schema: 1 }),
        1: (prev) => {
          const p = prev as { theme?: string; schema?: number };
          return { theme: p.theme ?? 'light', mode: p.theme === 'dark' ? 'dark' : 'light' };
        },
      },
    });

    const data = api.getLocal<{ theme: string; mode: string }>({
      name: 'prefs',
      initData: { theme: 'light', mode: 'light' },
    });

    expect(data.theme).toBe('dark');
    expect(data.mode).toBe('dark');

    const stored = JSON.parse(localStorage.getItem('prefs')!);
    expect(stored._v).toBe(2);
    expect(stored.data.mode).toBe('dark');
  });

  it('returns initData when stored version is newer than currentVersion', () => {
    localStorage.setItem('k', JSON.stringify({ _v: 99, data: { x: 1 } }));

    const api = createVersionedStorageApi(localStorage, {
      currentVersion: 1,
      migrations: { 0: (p) => p },
    });

    expect(api.getLocal({ name: 'k', initData: { x: 0 } })).toEqual({ x: 0 });
  });

  it('returns initData when migration throws', () => {
    localStorage.setItem('k', JSON.stringify({ old: true }));

    const api = createVersionedStorageApi(localStorage, {
      currentVersion: 2,
      migrations: {
        0: () => {
          throw new Error('bad');
        },
      },
    });

    expect(api.getLocal({ name: 'k', initData: { fallback: true } })).toEqual({ fallback: true });
  });

  it('putLocal merges with migrated existing payload', () => {
    localStorage.setItem('k', JSON.stringify({ count: 1 }));

    const api = createVersionedStorageApi(localStorage, {
      currentVersion: 1,
      migrations: {
        0: (prev) => ({ n: (prev as { count: number }).count }),
      },
    });

    const out = api.putLocal({
      name: 'k',
      initData: {},
      params: { n: 2 },
    });

    expect(out).toEqual({ n: 2 });
    expect(JSON.parse(localStorage.getItem('k')!).data).toEqual({ n: 2 });
  });

  it('throws if currentVersion is invalid', () => {
    expect(() =>
      createVersionedStorageApi(localStorage, { currentVersion: 0, migrations: {} }),
    ).toThrow();
  });

  it('adds savedAt when ttlMs is set', () => {
    const api = createVersionedStorageApi(localStorage, {
      currentVersion: 1,
      migrations: { 0: (p) => p },
      ttlMs: 60_000,
    });

    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    api.setLocal({ name: 'k', params: { a: 1 } });

    const raw = JSON.parse(localStorage.getItem('k')!);
    expect(raw.savedAt).toBe(1_700_000_000_000);
    vi.restoreAllMocks();
  });

  it('returns initData and removes key when ttl expired', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1_700_000_000_000));

    const api = createVersionedStorageApi(localStorage, {
      currentVersion: 1,
      migrations: { 0: (p) => p },
      ttlMs: 1000,
    });

    api.setLocal({ name: 'k', params: { a: 1 } });
    vi.setSystemTime(new Date(1_700_000_001_500));

    expect(api.getLocal({ name: 'k', initData: { a: 0 } })).toEqual({ a: 0 });
    expect(localStorage.getItem('k')).toBeNull();

    vi.useRealTimers();
  });

  it('does not expire legacy envelope without savedAt when ttlMs is set', () => {
    localStorage.setItem('k', JSON.stringify({ _v: 1, data: { a: 1 } }));

    const api = createVersionedStorageApi(localStorage, {
      currentVersion: 1,
      migrations: { 0: (p) => p },
      ttlMs: 1,
    });

    expect(api.getLocal({ name: 'k', initData: { a: 0 } })).toEqual({ a: 1 });
  });
});
