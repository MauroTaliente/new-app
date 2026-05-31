import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: '/test', search: '?foo=bar&n=7&flag=true', hash: '', state: null, key: 'default' }),
  useSearchParams: () => [new URLSearchParams('foo=bar&n=7&flag=true'), vi.fn()],
}));

import { useRouteQuery } from '../src/router-route-query.js';

describe('useRouteQuery (react-router)', () => {
  beforeEach(() => {
    navigate.mockClear();
    window.history.replaceState(null, '', '/test');
  });

  it('add por defecto usa navigate con replace', () => {
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ a: '2' }));
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining('a=2'), {
      replace: true,
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
    expect(navigate).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('set en modo replace usa navigate con replace', () => {
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.set({ a: '1' }));
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining('a=1'), { replace: true });
  });

  it('get lee search params', () => {
    const { result } = renderHook(() => useRouteQuery());
    expect(result.current.get('foo')).toBe('bar');
  });

  it('no navega si la URL final ya coincide', () => {
    window.history.replaceState(null, '', '/test?foo=bar');
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ foo: 'bar' }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('elimina query keys aunque window.location no coincida con el router', () => {
    window.history.replaceState(null, '', '/');
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ n: null }));
    expect(navigate).toHaveBeenCalledWith('/test?foo=bar&flag=true', {
      replace: true,
    });
  });

  it('no llama replaceState en add por defecto', () => {
    const spy = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useRouteQuery());
    act(() => result.current.add({ z: '9' }));
    expect(navigate).toHaveBeenCalled();
    expect(
      spy.mock.calls.some(
        (c) => typeof c[2] === 'string' && c[2].includes('z=9'),
      ),
    ).toBe(false);
    spy.mockRestore();
  });

  it('getGroup coerciona tipos desde defaults', () => {
    const { result } = renderHook(() => useRouteQuery());
    const g = result.current.getGroup({ foo: '', n: 0, flag: false });
    expect(g).toEqual({ foo: 'bar', n: 7, flag: true });
  });
});
