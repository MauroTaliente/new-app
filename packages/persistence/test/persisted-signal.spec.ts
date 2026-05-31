import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPersistedSignal } from '../src/persisted-signal.client';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('createPersistedSignal', () => {
  it('returns initData when the key is absent', () => {
    const s = createPersistedSignal<string | null>({ key: 'k', initData: null });
    expect(s.get()).toBe(null);
  });

  it('round-trips a value through get/set and persists JSON', () => {
    const s = createPersistedSignal<string | null>({ key: 'k', initData: null });
    s.set('abc');
    expect(s.get()).toBe('abc');
    expect(localStorage.getItem('k')).toBe(JSON.stringify('abc'));
  });

  it('notifies same-tab subscribers on set (the gap subscribeStorageKey leaves)', () => {
    const s = createPersistedSignal<number>({ key: 'n', initData: 0 });
    const listener = vi.fn();
    const off = s.subscribe(listener);
    s.set(1);
    s.set(2);
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    s.set(3);
    expect(listener).toHaveBeenCalledTimes(2); // unsubscribed → no further calls
  });

  it('reads a value persisted by a prior instance (reload simulation)', () => {
    createPersistedSignal<string | null>({ key: 'k', initData: null }).set('persisted');
    const fresh = createPersistedSignal<string | null>({ key: 'k', initData: null });
    expect(fresh.get()).toBe('persisted');
  });

  it('keeps a stable reference for object values while unchanged (snapshot cache)', () => {
    const s = createPersistedSignal<{ a: number }>({ key: 'o', initData: { a: 0 } });
    s.set({ a: 1 });
    const first = s.get();
    expect(s.get()).toBe(first); // same ref → useSyncExternalStore won't loop
    s.set({ a: 2 });
    expect(s.get()).not.toBe(first);
  });

  it('supports the session storage area', () => {
    const s = createPersistedSignal<string | null>({
      key: 'sk',
      storage: 'session',
      initData: null,
    });
    s.set('x');
    expect(sessionStorage.getItem('sk')).toBe(JSON.stringify('x'));
    expect(localStorage.getItem('sk')).toBe(null);
  });
});
