import { describe, it, expect } from 'vitest';
import {
  IS_BROWSER,
  isAsyncFunction,
  isInteger,
  isObject,
  mergeDeepRight,
  safeParse,
  safeStringify,
} from '../src/shared.js';

describe('mergeDeepRight edge cases', () => {
  it('returns left when right is null or undefined', () => {
    expect(mergeDeepRight({ a: 1 }, null)).toEqual({ a: 1 });
    expect(mergeDeepRight({ a: 1 }, undefined)).toEqual({ a: 1 });
  });

  it('returns right when left is null or undefined', () => {
    expect(mergeDeepRight(null, { a: 1 })).toEqual({ a: 1 });
    expect(mergeDeepRight(undefined, { a: 1 })).toEqual({ a: 1 });
  });

  it('rejects Date/Map/Set as plain objects', () => {
    expect(isObject(new Date())).toBe(false);
    expect(isObject(new Map())).toBe(false);
    expect(isObject(new Set())).toBe(false);
  });
});

describe('safeParse / safeStringify', () => {
  it('safeParse returns fallback for non-string input', () => {
    expect(safeParse(42, 'fallback')).toBe('fallback');
    expect(safeParse('', 'empty')).toBe('empty');
  });

  it('safeStringify returns fallback when JSON.stringify throws', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(safeStringify(circular, 2, 'ERR')).toBe('ERR');
  });
});

describe('additional guards', () => {
  it('isInteger distinguishes integers from floats', () => {
    expect(isInteger(3)).toBe(true);
    expect(isInteger(3.14)).toBe(false);
  });

  it('isAsyncFunction detects async functions only', () => {
    const asyncFn = async () => {};
    expect(isAsyncFunction(asyncFn)).toBe(true);
    expect(isAsyncFunction(() => {})).toBe(false);
  });

  it('IS_BROWSER reflects the test environment', () => {
    expect(typeof IS_BROWSER).toBe('boolean');
  });
});
