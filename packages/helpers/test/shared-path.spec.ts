import { describe, it, expect } from 'vitest';
import {
  getValueFromPath,
  mergeValueByPath,
  setValueByPath,
} from '../src/shared.js';

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
