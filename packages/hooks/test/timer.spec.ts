import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../src/timer.js';

describe('useTimer', () => {
  it('con disabled devuelve noop: sin play y métodos no-op', () => {
    const { result } = renderHook(() => useTimer({ disabled: true }, []));
    expect(result.current.play).toBe(false);
    expect(result.current.time).toBe(0);
    act(() => {
      result.current.playTimer();
      result.current.seek(100);
    });
    expect(result.current.play).toBe(false);
    expect(result.current.time).toBe(0);
  });

  it('expone números coherentes cuando está habilitado', () => {
    const { result } = renderHook(() =>
      useTimer({ limit: 1000, scale: 1, interval: 60_000, disabled: false }, []),
    );
    expect(result.current.countdown).toBeLessThanOrEqual(1000);
    expect(result.current.play).toBe(false);
  });
});
