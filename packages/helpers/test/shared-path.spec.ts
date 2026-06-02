import { describe, it, expect } from 'vitest';
import {
  getValueFromPath,
  hasValueByPath,
  mergeValueByPath,
  setValueByPath,
} from '../src/shared.js';

describe('hasValueByPath (presence, not value)', () => {
  const data = { a: 1, b: undefined, nested: { c: 2 }, list: [10] };

  it('is true for a present key even when its value is undefined', () => {
    expect(hasValueByPath('a', data)).toBe(true);
    expect(hasValueByPath('b', data)).toBe(true); // present but undefined
  });

  it('is false for an absent key', () => {
    expect(hasValueByPath('zzz', data)).toBe(false);
    expect(hasValueByPath('nested/zzz', data)).toBe(false);
  });

  it('traverses nested object + array paths', () => {
    expect(hasValueByPath('nested/c', data)).toBe(true);
    expect(hasValueByPath('list/0', data)).toBe(true);
    expect(hasValueByPath('list/5', data)).toBe(false);
  });

  it('is false on empty path or nullish data', () => {
    expect(hasValueByPath('', data)).toBe(false);
    expect(hasValueByPath('a/b', null)).toBe(false);
  });
});

describe('path resolvers (form-style slash paths)', () => {
  const nested = { user: { name: 'Ada', tags: ['a', 'b'] } };

  it('getValueFromPath reads nested object keys', () => {
    expect(getValueFromPath('user/name', nested)).toBe('Ada');
    expect(getValueFromPath('user/tags', nested)).toEqual(['a', 'b']);
  });

  it('resolves array slots with a numeric path segment (not bracket syntax)', () => {
    expect(getValueFromPath('user/tags/1', nested)).toBe('b');
  });

  it('setValueByPath creates nested objects from an empty root', () => {
    expect(setValueByPath('user/name', 'Grace', {})).toEqual({ user: { name: 'Grace' } });
  });

  it('setValueByPath replaces a nested leaf', () => {
    expect(setValueByPath('user/name', 'Grace', nested)).toEqual({
      user: { name: 'Grace', tags: ['a', 'b'] },
    });
  });

  it('mergeValueByPath deep-merges nested objects without dropping siblings', () => {
    expect(mergeValueByPath('user/name', 'Grace', nested)).toEqual({
      user: { name: 'Grace', tags: ['a', 'b'] },
    });
  });

  it('mergeValueByPath merges array slots index-by-index', () => {
    const rows = [{ id: 1, name: 'Ada' }];
    expect(mergeValueByPath('0/name', 'Grace', rows)).toEqual([{ id: 1, name: 'Grace' }]);
  });

  it('mergeValueByPath can create an object when the parent is null', () => {
    expect(mergeValueByPath('name', 'leaf', null)).toEqual({ name: 'leaf' });
  });

  it('setValueByPath updates an array slot when the segment is numeric', () => {
    const rows = [{ name: 'Ada' }, { name: 'Bob' }];
    expect(setValueByPath('1/name', 'Zoe', rows)).toEqual([{ name: 'Ada' }, { name: 'Zoe' }]);
  });

  it('setValueByPath replaces a root array index', () => {
    expect(setValueByPath('[1]', 'replaced', ['keep', 'old'])).toEqual(['keep', 'replaced']);
  });
});
