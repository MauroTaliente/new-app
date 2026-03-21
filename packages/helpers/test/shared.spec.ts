import { describe, it, expect } from 'vitest';
import { isObject, mergeDeepRight, safeParse } from '../src/shared.js';

describe('mergeDeepRight', () => {
  it('merges nested objects with right winning', () => {
    expect(mergeDeepRight({ a: { x: 1 } }, { a: { y: 2 } })).toEqual({ a: { x: 1, y: 2 } });
  });

  it('replaces non-object leaves with right', () => {
    expect(mergeDeepRight({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });
});

describe('isObject', () => {
  it('rejects arrays and null', () => {
    expect(isObject(null)).toBe(false);
    expect(isObject([])).toBe(false);
    expect(isObject({})).toBe(true);
  });
});

describe('safeParse', () => {
  it('returns fallback on invalid JSON', () => {
    expect(safeParse('not-json', 'fallback')).toBe('fallback');
  });

  it('parses valid JSON', () => {
    expect(safeParse('{"a":1}', null)).toEqual({ a: 1 });
  });
});
