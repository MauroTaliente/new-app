import { describe, expect, it } from 'vitest';
import { queryInt, queryString, safeInt, safeString } from '../src/router.js';

describe('@react33/react-helpers/router entry', () => {
  it('re-exports int parsers', () => {
    expect(safeInt('2', 1)).toBe(2);
    expect(queryInt(9)(null)).toBe(9);
  });

  it('re-exports string parsers', () => {
    expect(safeString('  x  ')).toBe('x');
    expect(queryString()(null)).toBe('');
  });
});
