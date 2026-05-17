import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRouteQueryCore } from '../src/route-query-shared.js';

function mountCore(initialSearch = 'foo=bar&n=7') {
  const applyUrl = vi.fn();
  const searchParams = new URLSearchParams(initialSearch);
  const hook = renderHook(
    ({ sp }) =>
      useRouteQueryCore('f', '_', {
        pathname: '/list',
        searchParams: sp,
        applyUrl,
      }),
    { initialProps: { sp: searchParams } },
  );
  return { applyUrl, ...hook };
}

describe('useRouteQueryCore', () => {
  it('add merges params with tag prefix and calls applyUrl', () => {
    const { result, applyUrl } = mountCore();
    act(() => result.current.add({ status: 'open' }));
    expect(applyUrl).toHaveBeenCalledWith('/list?foo=bar&n=7&f_status=open', 'silent');
  });

  it('removes tagged keys when payload value is empty', () => {
    const { result, applyUrl } = mountCore('f_foo=bar');
    act(() => result.current.add({ foo: '' }));
    expect(applyUrl).toHaveBeenCalledWith('/list', 'silent');
  });

  it('does not call applyUrl when tagged values are unchanged', () => {
    const { result, applyUrl } = mountCore('f_foo=bar');
    act(() => result.current.add({ foo: 'bar' }));
    expect(applyUrl).not.toHaveBeenCalled();
  });

  it('clean strips the query string', () => {
    const { result, applyUrl } = mountCore('foo=bar');
    act(() => result.current.clean());
    expect(applyUrl).toHaveBeenCalledWith('/list', 'replace');
  });

  it('getGroup reads tagged params and coerces types', () => {
    const sp = new URLSearchParams('f_foo=bar&f_n=7&f_flag=true');
    const applyUrl = vi.fn();
    const { result } = renderHook(() =>
      useRouteQueryCore('f', '_', {
        pathname: '/list',
        searchParams: sp,
        applyUrl,
      }),
    );
    expect(result.current.getGroup({ foo: '', n: 0, flag: false })).toEqual({
      foo: 'bar',
      n: 7,
      flag: true,
    });
  });
});
