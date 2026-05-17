import { describe, it, expect } from 'vitest';
import {
  addMonthsSafe,
  buildCalendarMonth,
  capitalized,
  clampDate,
  getFallback,
  getPathSegmentReady,
  getValueFromPath,
  isArray,
  isDeepEqual,
  isEmpty,
  isEmptyArray,
  isEmptyObject,
  isFunction,
  isNestedEmptyObject,
  isNullOrEmpty,
  isNullOrUndefined,
  isNumber,
  isObject,
  isSameLocalDay,
  isString,
  isValidDate,
  mergeDeepRight,
  mergeValueByPath,
  normalizeDateRange,
  normalizeString,
  removePathParts,
  safeNumber,
  safeParse,
  safeStringify,
  setValueByPath,
  sortDeep,
  toDateSafe,
  toLocalDateKey,
} from '../src/shared.js';

describe('mergeDeepRight', () => {
  it('merges nested objects with right winning', () => {
    expect(mergeDeepRight({ a: { x: 1 } }, { a: { y: 2 } })).toEqual({ a: { x: 1, y: 2 } });
  });

  it('replaces non-object leaves with right', () => {
    expect(mergeDeepRight({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it('merges arrays index-by-index (Ramda-style)', () => {
    expect(mergeDeepRight([{ x: 1 }], [{ y: 2 }])).toEqual([{ x: 1, y: 2 }]);
    expect(mergeDeepRight(['a'], ['b', 'c'])).toEqual(['b', 'c']);
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

describe('date helpers', () => {
  it('normalizes range order', () => {
    const start = new Date(2026, 8, 28);
    const end = new Date(2026, 8, 12);
    const [normalizedStart, normalizedEnd] = normalizeDateRange(start, end);
    expect(toLocalDateKey(normalizedStart as Date)).toBe('2026-09-12');
    expect(toLocalDateKey(normalizedEnd as Date)).toBe('2026-09-28');
  });

  it('builds a six-week month grid', () => {
    const { weeks } = buildCalendarMonth(new Date(2026, 3, 20), 1);
    expect(weeks.length).toBe(6);
    expect(weeks[0]?.length).toBe(7);
    expect(weeks[5]?.length).toBe(7);
  });

  it('adds months preserving first-day convention', () => {
    const moved = addMonthsSafe(new Date(2026, 0, 15), 2);
    expect(toLocalDateKey(moved)).toBe('2026-03-01');
  });

  it('compares and clamps local days', () => {
    const a = new Date(2026, 3, 10);
    const b = new Date(2026, 3, 20);
    expect(isSameLocalDay(a, a)).toBe(true);
    expect(clampDate(new Date(2026, 3, 5), a, b)).toEqual(a);
    expect(clampDate(new Date(2026, 3, 25), a, b)).toEqual(b);
  });
});

describe('type guards and string helpers', () => {
  it('classifies primitives and collections', () => {
    expect(isString('x')).toBe(true);
    expect(isNumber(3)).toBe(true);
    expect(isArray([1])).toBe(true);
    expect(isEmptyObject({})).toBe(true);
    expect(isEmptyArray([])).toBe(true);
    expect(isNullOrUndefined(null)).toBe(true);
    expect(isNullOrEmpty('')).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isFunction(() => {})).toBe(true);
    expect(isNestedEmptyObject({ a: { b: '' } })).toBe(true);
  });

  it('normalizes and capitalizes strings', () => {
    expect(normalizeString('Café')).toBe('cafe');
    expect(capitalized('hola')).toBe('Hola');
    expect(capitalized('')).toBe('');
  });

  it('safeStringify and safeNumber handle edge cases', () => {
    expect(safeStringify('raw')).toBe('raw');
    expect(safeStringify({ a: 1 })).toContain('"a"');
    expect(safeNumber('42', 0)).toBe(42);
    expect(safeNumber('nope', 7)).toBe(7);
  });

  it('getFallback returns first non-undefined value', () => {
    expect(getFallback(undefined, 'ok', 'later')).toBe('ok');
    expect(getFallback(undefined, null)).toBe(null);
    expect(getFallback()).toBeUndefined();
  });
});

describe('deep utilities', () => {
  it('sortDeep orders object keys', () => {
    expect(sortDeep({ b: 1, a: { z: 2, y: 1 } })).toEqual({ a: { y: 1, z: 2 }, b: 1 });
  });

  it('isDeepEqual compares sorted structures', () => {
    expect(isDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
});

describe('path helpers', () => {
  it('parses path segments with optional array index', () => {
    expect(getPathSegmentReady('items[2]')).toEqual({ property: 'items', index: 2 });
    expect(getPathSegmentReady('name')).toEqual({ property: 'name', index: undefined });
  });

  it('reads and writes nested values by path', () => {
    const data = { user: { name: 'Ada', tags: ['a', 'b'] } };
    expect(getValueFromPath('user/name', data)).toBe('Ada');
    expect(mergeValueByPath('user/name', 'Grace', data)).toEqual({
      user: { name: 'Grace', tags: ['a', 'b'] },
    });
    expect(setValueByPath('count', 9, { count: 1 })).toEqual({ count: 9 });
  });

  it('removePathParts trims URL-like paths', () => {
    expect(removePathParts('/a/b/c?x=1', 1)).toBe('/b/c?x=1');
    expect(removePathParts('/a/b', 1, false)).toBe('/a');
  });
});

describe('toDateSafe', () => {
  it('parses strings and rejects invalid values', () => {
    expect(toDateSafe('2026-04-20')?.getFullYear()).toBe(2026);
    expect(toDateSafe('not-a-date')).toBeNull();
    expect(isValidDate(new Date('invalid'))).toBe(false);
  });
});
