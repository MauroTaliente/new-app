import { describe, it, expect, beforeEach } from 'vitest';
import { getLocalStorage, setLocalStorage, putLocalStorage } from '../src/storage.js';

describe('createStorageApi (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setLocal round-trips JSON values', () => {
    setLocalStorage({ name: 'k', params: { a: 1 } });
    expect(getLocalStorage<{ a: number }>({ name: 'k', initData: { a: 0 } })).toEqual({ a: 1 });
  });

  it('putLocal merges with existing object state', () => {
    setLocalStorage({ name: 'k', params: { a: 1, b: 2 } });
    putLocalStorage({ name: 'k', initData: {}, params: { b: 3 } });
    expect(getLocalStorage({ name: 'k', initData: {} })).toEqual({ a: 1, b: 3 });
  });
});
