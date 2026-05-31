import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams('foo=bar&n=7&flag=true'),
}));

import { useRouteQuery } from '../src/next-route-query.js';

describe('useRouteQuery (next)', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    window.history.replaceState(null, '', '/test');
  });

  it('add por defecto usa router.replace', () => {
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ a: '2' }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('a=2'), {
      scroll: false,
    });
  });

  it('add con silent usa history.replaceState (edge)', () => {
    const spy = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ a: '2' }, 'silent'));
    expect(spy).toHaveBeenCalled();
    const withQuery = spy.mock.calls.find(
      (c) => typeof c[2] === 'string' && c[2].includes('a=2') && c[2].includes('foo=bar'),
    );
    expect(withQuery).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
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

  it('add con push usa router.push', () => {
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ extra: '1' }, 'push'));
    expect(push).toHaveBeenCalledWith(expect.stringContaining('extra=1'), { scroll: false });
  });

  it('set con replace usa router.replace', () => {
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.set({ only: 'x' }, 'replace'));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('only=x'), { scroll: false });
  });

  it('no navega si la URL final ya coincide', () => {
    window.history.replaceState(null, '', '/test?foo=bar');
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ foo: 'bar' }));
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('clean navega al pathname sin query', () => {
    window.history.replaceState(null, '', '/test?foo=bar');
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.clean());
    expect(replace).toHaveBeenCalledWith('/test', { scroll: false });
  });
});
