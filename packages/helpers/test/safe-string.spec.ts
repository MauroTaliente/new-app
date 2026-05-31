import { describe, expect, it } from 'vitest';
import { queryString, safeString } from '../src/safe-string.js';

describe('safeString', () => {
  it('returns fallback when raw is absent or empty', () => {
    expect(safeString(null, 'x')).toBe('x');
    expect(safeString('', 'x')).toBe('x');
    expect(safeString(null)).toBe('');
  });

  it('returns trimmed raw value', () => {
    expect(safeString('  hello  ')).toBe('hello');
    expect(safeString('atacama')).toBe('atacama');
  });
});

describe('queryString', () => {
  it('returns a getGroup-compatible resolver', () => {
    const parse = queryString();
    expect(parse(null)).toBe('');
    expect(parse('  q  ')).toBe('q');
  });
});
