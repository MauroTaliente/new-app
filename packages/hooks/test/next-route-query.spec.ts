import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams('foo=bar&n=7&flag=true'),
}));

import { useRouteQuery, getObjectWithTag, removeTagFromObject } from '../src/next-route-query.js';

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

describe('useRouteQuery', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    window.history.replaceState(null, '', '/test');
  });

  it('add escribe query en modo silent con history.replaceState', () => {
    const spy = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ a: '2' }));
    expect(spy).toHaveBeenCalled();
    const withQuery = spy.mock.calls.find(
      (c) => typeof c[2] === 'string' && c[2].includes('a=2') && c[2].includes('foo=bar'),
    );
    expect(withQuery).toBeDefined();
    spy.mockRestore();
  });

  it('get lee search params', () => {
    const { result } = renderHook(() => useRouteQuery());
    expect(result.current.get('foo')).toBe('bar');
  });

  it('getGroup coerciona tipos desde defaults', () => {
    const { result } = renderHook(() => useRouteQuery());
    const g = result.current.getGroup({ foo: '', n: 0, flag: false });
    expect(g).toEqual({ foo: 'bar', n: 7, flag: true });
  });
});
