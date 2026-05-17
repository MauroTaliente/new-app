import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../src/timer.js';

describe('useTimer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('play, pause y seek actualizan tiempo reactivo', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimer(
        { limit: 1000, interval: 50, isReactive: true, disabled: false, onChange },
        [],
      ),
    );

    act(() => result.current.playTimer());
    expect(result.current.play).toBe(true);

    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(result.current.time).toBeGreaterThan(0);

    act(() => result.current.pauseTimer());
    expect(result.current.play).toBe(false);

    act(() => result.current.seek(500));
    expect(result.current.time).toBe(500);
  });

  it('dispara onExpired y detiene al alcanzar el límite', () => {
    vi.useFakeTimers();
    const onExpired = vi.fn();
    const { result } = renderHook(() =>
      useTimer(
        {
          limit: 100,
          interval: 20,
          isReactive: true,
          disabled: false,
          onExpired,
        },
        [],
      ),
    );

    act(() => result.current.playTimer());
    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(result.current.play).toBe(false);
    expect(result.current.time).toBe(100);
    expect(result.current.countdown).toBe(0);
  });

  it('onChange entrega tiempo actualizado mientras corre', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimer(
        {
          limit: 1000,
          interval: 50,
          isReactive: true,
          disabled: false,
          onChange,
          onChangeThrottleMs: 0,
        },
        [],
      ),
    );

    act(() => result.current.playTimer());
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onChange).toHaveBeenCalled();
    expect(result.current.time).toBeGreaterThan(0);
    expect(result.current.play).toBe(true);
  });

  it('pauseWhenHidden pausa y resumeOnVisible reanuda', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useTimer({
        limit: 5000,
        interval: 50,
        isReactive: true,
        disabled: false,
        pauseWhenHidden: true,
        resumeOnVisible: true,
      }),
    );

    act(() => result.current.playTimer());
    expect(result.current.play).toBe(true);

    Object.defineProperty(document, 'hidden', { configurable: true, writable: true, value: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.play).toBe(false);

    Object.defineProperty(document, 'hidden', { configurable: true, writable: true, value: false });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.play).toBe(true);

    Object.defineProperty(document, 'hidden', { configurable: true, writable: true, value: false });
  });

  it('resetTimer reinicia tiempo y deja play en true', () => {
    vi.useFakeTimers();
    const onStart = vi.fn();
    const { result } = renderHook(() =>
      useTimer({
        limit: 1000,
        interval: 50,
        isReactive: true,
        disabled: false,
        onStart,
      }),
    );

    act(() => result.current.playTimer());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.time).toBeGreaterThan(0);

    act(() => result.current.resetTimer());
    expect(result.current.time).toBe(0);
    expect(result.current.play).toBe(true);
    expect(onStart).toHaveBeenCalled();
  });

  it('setLimit dispara onExpired si el tiempo ya superó el nuevo límite', () => {
    vi.useFakeTimers();
    const onExpired = vi.fn();
    const { result } = renderHook(() =>
      useTimer({
        limit: 1000,
        interval: 50,
        isReactive: true,
        disabled: false,
        onExpired,
      }),
    );

    act(() => result.current.playTimer());
    act(() => {
      vi.advanceTimersByTime(400);
    });
    onExpired.mockClear();

    act(() => result.current.setLimit(200));
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(result.current.play).toBe(false);
    expect(result.current.time).toBe(200);
  });

  it('controlTimer alterna play y pause', () => {
    const { result } = renderHook(() =>
      useTimer({ limit: 5000, interval: 1000, disabled: false }, []),
    );
    act(() => result.current.controlTimer());
    expect(result.current.play).toBe(true);
    act(() => result.current.controlTimer());
    expect(result.current.play).toBe(false);
  });
});
