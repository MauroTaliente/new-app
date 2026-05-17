import { describe, it, expect, beforeEach } from 'vitest';
import { getLocalStorage, setLocalStorage } from '../src/storage.js';

describe('storage driver edge cases', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips plain string tokens when initData is a string', () => {
    setLocalStorage({ name: 'auth-token', params: 'abc123' });
    expect(getLocalStorage({ name: 'auth-token', initData: '' })).toBe('abc123');
  });

  it('returns initData when stored JSON is invalid and initData is not a plain string', () => {
    localStorage.setItem('bad-json', 'not-json{');
    expect(getLocalStorage({ name: 'bad-json', initData: { ok: true } })).toEqual({ ok: true });
  });

  it('returns initData when key is missing', () => {
    expect(getLocalStorage({ name: 'missing', initData: { count: 0 } })).toEqual({ count: 0 });
  });
});
