import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  parseCssLengthToPx,
  useResponsiveValue,
  useAdaptiveValueBySize,
  useActiveBreakpoint,
} from '../src/viewport.js';

describe('parseCssLengthToPx', () => {
  it('parses px', () => {
    expect(parseCssLengthToPx('48px')).toBe(48);
  });

  it('parses rem with default root 16', () => {
    expect(parseCssLengthToPx('2rem')).toBe(32);
  });

  it('respects custom root font size for rem', () => {
    expect(parseCssLengthToPx('1rem', 10)).toBe(10);
  });

  it('parses unitless as number', () => {
    expect(parseCssLengthToPx('480')).toBe(480);
  });

  it('returns 0 for empty or invalid', () => {
    expect(parseCssLengthToPx('')).toBe(0);
    expect(parseCssLengthToPx('  ')).toBe(0);
  });
});

const screen = {
  xs: '30rem',
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
};

describe('useResponsiveValue', () => {
  it('elige el último valor cuyo breakpoint ≤ al del currentBp', () => {
    const { result, rerender } = renderHook(
      ({ currentBp }: { currentBp: string }) =>
        useResponsiveValue(currentBp, { xs: 1, sm: 2, md: 3, lg: 4 }, screen),
      { initialProps: { currentBp: 'md' } },
    );
    expect(result.current).toBe(3);

    rerender({ currentBp: 'lg' });
    expect(result.current).toBe(4);
  });
});

describe('useAdaptiveValueBySize', () => {
  it('fusiona objetos por breakpoint activo', () => {
    const { result } = renderHook(() =>
      useAdaptiveValueBySize({ 0: { a: 1 }, 768: { b: 2 } }, 900),
    );
    expect(result.current[1]).toBe(768);
    expect(result.current[0]).toEqual({ a: 1, b: 2 });
  });

  it('usa solo el nivel base si size es chico', () => {
    const { result } = renderHook(() =>
      useAdaptiveValueBySize({ 0: { a: 1 }, 768: { b: 2 } }, 400),
    );
    expect(result.current[1]).toBe(0);
    expect(result.current[0]).toEqual({ a: 1 });
  });
});

describe('useActiveBreakpoint', () => {
  const setInnerSize = (w: number, h = 600) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: w });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: h });
  };

  beforeEach(() => {
    setInnerSize(1024);
  });

  afterEach(() => {
    act(() => {
      setInnerSize(1024);
      window.dispatchEvent(new Event('resize'));
    });
  });

  it('activa el mayor breakpoint que cabe en el ancho', () => {
    setInnerSize(900);
    const { result } = renderHook(() => useActiveBreakpoint(screen));
    expect(result.current[0]).toBe('md');
    expect(result.current[2]).toBe(900);
  });

  it('actualiza al redimensionar', () => {
    setInnerSize(1200);
    const { result } = renderHook(() => useActiveBreakpoint(screen));
    expect(result.current[0]).toBe('lg');

    act(() => {
      setInnerSize(500);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current[0]).toBe('xs');
  });
});
