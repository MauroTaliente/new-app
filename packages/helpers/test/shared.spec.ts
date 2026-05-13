import { describe, it, expect } from 'vitest';
import {
  addMonthsSafe,
  buildCalendarMonth,
  isObject,
  mergeDeepRight,
  normalizeDateRange,
  safeParse,
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
});
