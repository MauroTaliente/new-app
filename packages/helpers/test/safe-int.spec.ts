import { describe, expect, it } from 'vitest';
import { queryInt, safeInt } from '../src/safe-int.js';

describe('safeInt', () => {
  it('returns fallback when raw is absent or empty', () => {
    expect(safeInt(null, 9)).toBe(9);
    expect(safeInt('', 9)).toBe(9);
  });

  it('parses valid integers and floors decimals', () => {
    expect(safeInt('3', 1)).toBe(3);
    expect(safeInt('2.9', 1)).toBe(2);
  });

  it('returns fallback for invalid numbers', () => {
    expect(safeInt('foo', 1)).toBe(1);
    expect(safeInt('NaN', 5)).toBe(5);
  });

  it('clamps to min (default 1)', () => {
    expect(safeInt('0', 9)).toBe(1);
    expect(safeInt('-3', 9)).toBe(1);
    expect(safeInt('2', 9, 5)).toBe(5);
  });
});

describe('queryInt', () => {
  it('returns a getGroup-compatible resolver', () => {
    const parse = queryInt(9);
    expect(parse(null)).toBe(9);
    expect(parse('12')).toBe(12);
    expect(parse('nope')).toBe(9);
  });
});
