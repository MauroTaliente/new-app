import { describe, expect, it } from 'vitest';

import { omitNullOrEmpty, omitNullOrEmptyDeep } from '../src/shared.js';

describe('omitNullOrEmpty (shallow)', () => {
  it('drops keys whose value is null/undefined/""/[]/{}', () => {
    expect(
      omitNullOrEmpty({
        a: 1,
        b: '',
        c: null,
        d: undefined,
        e: [],
        f: {},
        g: 0,
        h: false,
        i: 'x',
      }),
    ).toEqual({ a: 1, g: 0, h: false, i: 'x' });
  });

  it('filters empty entries from arrays (indexes collapse)', () => {
    expect(omitNullOrEmpty(['a', '', null, 'b', undefined, [], {}])).toEqual(['a', 'b']);
  });

  it('keeps non-empty nested values as-is (shallow)', () => {
    const nested = { filters: { name: '', tags: [] }, page: 1 };
    // `filters` is not empty as an object → it survives untouched.
    expect(omitNullOrEmpty(nested)).toEqual({ filters: { name: '', tags: [] }, page: 1 });
  });

  it('returns primitives unchanged', () => {
    expect(omitNullOrEmpty(0 as any)).toBe(0);
    expect(omitNullOrEmpty('hi' as any)).toBe('hi');
    expect(omitNullOrEmpty(null as any)).toBeNull();
  });

  it('does not mutate the input', () => {
    const input = { a: 1, b: '' };
    const out = omitNullOrEmpty(input);
    expect(input).toEqual({ a: 1, b: '' });
    expect(out).not.toBe(input);
  });
});

describe('omitNullOrEmptyDeep', () => {
  it('prunes nested branches that collapse to empty', () => {
    expect(
      omitNullOrEmptyDeep({
        filters: { name: '', tags: [] },
        page: 1,
      }),
    ).toEqual({ page: 1 });
  });

  it('keeps nested branches that retain non-empty values', () => {
    expect(
      omitNullOrEmptyDeep({
        filters: { name: 'ada', tags: [] },
        page: 1,
      }),
    ).toEqual({ filters: { name: 'ada' }, page: 1 });
  });

  it('walks into arrays and drops empty entries after cleaning', () => {
    expect(
      omitNullOrEmptyDeep([
        { a: 1, b: '' },
        { a: '', b: '' },
        'x',
        '',
      ]),
    ).toEqual([{ a: 1 }, 'x']);
  });

  it('preserves truthy falsy primitives (0, false)', () => {
    expect(omitNullOrEmptyDeep({ count: 0, ok: false, gone: null })).toEqual({
      count: 0,
      ok: false,
    });
  });
});
