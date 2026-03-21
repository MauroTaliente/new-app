import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLatest } from '../src/latest.js';
import { useEffect } from 'react';

describe('useLatest', () => {
  it('expone siempre el valor más reciente en un efecto', () => {
    const seen: number[] = [];
    const { result, rerender } = renderHook(
      ({ n }: { n: number }) => {
        const ref = useLatest(n);
        useEffect(() => {
          seen.push(ref.current);
        }, [n]);
        return ref;
      },
      { initialProps: { n: 1 } },
    );

    expect(result.current.current).toBe(1);
    rerender({ n: 2 });
    expect(seen).toContain(2);
    expect(result.current.current).toBe(2);
  });
});
