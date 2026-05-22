import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMediaQuery, usePrefersColorScheme } from '../src/media.js';

describe('useMediaQuery', () => {
  const listeners = new Map<string, Set<() => void>>();

  afterEach(() => {
    listeners.clear();
    vi.restoreAllMocks();
  });

  function mockMatchMedia(initialMatches: boolean) {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      const mql = {
        matches: initialMatches,
        media: query,
        addEventListener: (_: string, cb: () => void) => {
          if (!listeners.has(query)) listeners.set(query, new Set());
          listeners.get(query)!.add(cb);
        },
        removeEventListener: (_: string, cb: () => void) => {
          listeners.get(query)?.delete(cb);
        },
      } as MediaQueryList;
      return mql;
    });
  }

  it('suscribe cambios y actualiza matches', () => {
    let matches = false;
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      const mql = {
        get matches() {
          return matches;
        },
        media: query,
        addEventListener: (_: string, cb: () => void) => {
          if (!listeners.has(query)) listeners.set(query, new Set());
          listeners.get(query)!.add(cb);
        },
        removeEventListener: (_: string, cb: () => void) => {
          listeners.get(query)?.delete(cb);
        },
      } as MediaQueryList;
      return mql;
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 800px)'));
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.get('(min-width: 800px)')?.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });
});

describe('usePrefersColorScheme', () => {
  it('devuelve dark cuando la media query de esquema coincide', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList));

    const { result } = renderHook(() => usePrefersColorScheme());
    expect(result.current).toBe('dark');
  });
});
