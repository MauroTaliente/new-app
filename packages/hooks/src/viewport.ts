'use client';

import { useIsomorphicLayoutEffect } from './layout.js';
import { mergeDeepRight, isObject } from '@react33/react-helpers';
import { useEffect, useMemo, useState } from 'react';

/** Parse simple CSS lengths (`px`, `rem`, unitless) to pixels (root `rem` = 16px by default). */
export function parseCssLengthToPx(input: string, rootFontSizePx = 16): number {
  const s = input.trim().toLowerCase();
  if (!s) return 0;
  if (s.endsWith('rem')) return parseFloat(s) * rootFontSizePx;
  if (s.endsWith('em')) return parseFloat(s) * rootFontSizePx;
  if (s.endsWith('px')) return parseFloat(s);
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function getBreakpointPxMap(screen: Record<string, string>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(screen).map(([k, v]) => [k, parseCssLengthToPx(v)]),
  );
}

export type WindowSize = { width: number; height: number };

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Pick the value for the largest breakpoint ≤ current width.
 */
export function useResponsiveValue<T>(
  currentBp: string,
  values: Partial<Record<string, T>> = {},
  screen: Record<string, string>,
): T | undefined {
  const pxMap = useMemo(() => getBreakpointPxMap(screen), [screen]);

  return useMemo(() => {
    const entries = Object.entries(values) as [string, T][];
    const currentValue = pxMap[currentBp] ?? 0;

    const sorted = entries.sort((a, b) => (pxMap[a[0]] ?? 0) - (pxMap[b[0]] ?? 0));

    let result: T | undefined;
    for (const [key, val] of sorted) {
      if ((pxMap[key] ?? 0) <= currentValue) {
        result = val;
      }
    }
    return result;
  }, [currentBp, values, pxMap]);
}

/**
 * Tracks which named breakpoint matches `window.innerWidth` (mobile-first: last match wins).
 * Returns `[activeKey, flagsByKey, width]`.
 */
export function useActiveBreakpoint(screen: Record<string, string>) {
  const { width } = useWindowSize();

  const sortedScreens = useMemo(() => {
    const pxMap = getBreakpointPxMap(screen);
    return (Object.entries(screen) as [string, string][])
      .map(([key]) => [key, pxMap[key] ?? 0] as const)
      .sort((a, b) => a[1] - b[1]);
  }, [screen]);

  const [active, setActive] = useState<string>(() => sortedScreens[0]?.[0] ?? '');

  useIsomorphicLayoutEffect(() => {
    let newActive = sortedScreens[0]?.[0] ?? '';
    for (const [key, bpValue] of sortedScreens) {
      if (width >= bpValue) newActive = key;
    }
    setActive((prev) => (prev === newActive ? prev : newActive));
  }, [width, sortedScreens]);

  const pxMap = useMemo(() => getBreakpointPxMap(screen), [screen]);
  const activeValue = pxMap[active] ?? 0;

  const flags = useMemo(() => {
    return Object.fromEntries(
      Object.entries(pxMap).map(([key, val]) => [key, activeValue >= val]),
    ) as Record<string, boolean>;
  }, [pxMap, activeValue]);

  return [active, flags, width] as const;
}

/**
 * Merge nested config by active width key (deep merge via `@react33/react-helpers`).
 */
export function useAdaptiveValueBySize<T>(
  bpData: Record<number, T>,
  size: number,
): readonly [T, number] {
  const breakpoints = useMemo(() => {
    return Object.keys(bpData)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
  }, [bpData]);

  const [active, setActive] = useState<number>(breakpoints[0] ?? 0);

  useIsomorphicLayoutEffect(() => {
    let bestMatch = breakpoints[0] ?? 0;
    for (const bp of breakpoints) {
      if (bp <= size) bestMatch = bp;
    }
    setActive((prev) => (prev === bestMatch ? prev : bestMatch));
  }, [breakpoints, size]);

  const value = useMemo(() => {
    const base = bpData[breakpoints[0]] as T;
    const current = bpData[active] as T;
    if (base === undefined) return current;
    if (current === undefined) return base;
    if (isObject(base) && isObject(current)) {
      return mergeDeepRight(base as object, current as object) as T;
    }
    return current;
  }, [active, bpData, breakpoints]);

  return [value, active] as const;
}
