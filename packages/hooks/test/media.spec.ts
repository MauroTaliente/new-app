import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaQuery, usePrefersColorScheme } from '../src/media.js';

function mockMatchMedia(
  impl: (query: string) => { matches: boolean; addEventListener?: () => void; removeEventListener?: () => void },
) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    const { matches, addEventListener = () => {}, removeEventListener = () => {} } = impl(query);
    return {
      matches,
      media: query,
      addEventListener,
      removeEventListener,
      dispatchEvent: () => true,
    };
  }) as typeof window.matchMedia;
}

describe('useMediaQuery', () => {
  it('devuelve matches de matchMedia tras el efecto', () => {
    mockMatchMedia((q) => ({ matches: q.includes('min-width') }));
    const { result } = renderHook(() => useMediaQuery('(min-width: 1px)'));
    expect(result.current).toBe(true);
  });
});

describe('usePrefersColorScheme', () => {
  it('devuelve dark si prefers-color-scheme: dark matchea', () => {
    mockMatchMedia((q) => ({ matches: q.includes('dark') }));
    const { result } = renderHook(() => usePrefersColorScheme());
    expect(result.current).toBe('dark');
  });

  it('devuelve light si no hay dark', () => {
    mockMatchMedia(() => ({ matches: false }));
    const { result } = renderHook(() => usePrefersColorScheme());
    expect(result.current).toBe('light');
  });
});
