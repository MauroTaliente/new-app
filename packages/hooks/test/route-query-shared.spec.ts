import { describe, it, expect } from 'vitest';
import { getObjectWithTag, removeTagFromObject } from '../src/route-query-shared.js';

describe('getObjectWithTag', () => {
  it('prefija claves con tag y sep', () => {
    expect(getObjectWithTag({ a: 1, b: 2 }, 'f', '_')).toEqual({ f_a: 1, f_b: 2 });
  });
});

describe('removeTagFromObject', () => {
  it('quita el prefijo de las claves', () => {
    expect(removeTagFromObject({ f_a: 1, f_b: 2 }, 'f', '_')).toEqual({ a: 1, b: 2 });
  });

  it('deja claves sin prefijo intactas', () => {
    expect(removeTagFromObject({ f_a: 1, other: 3 }, 'f', '_')).toEqual({ a: 1, other: 3 });
  });
});
