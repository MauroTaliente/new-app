'use client';

import { useMemo, useEffect, useState } from 'react';
import { buildStyles, type ClassValue } from './shared';
import { type ProcessedModel, type BuildStyles } from './module';

// hook
export function useBuildStyles<T extends BuildStyles>(
  data: T,
  deps: any[] = [],
): ProcessedModel<T> {
  return useMemo(() => buildStyles(data), [...deps]);
}

/**
 * React hook to get the current value of a CSS variable.
 */
export const useCssVariable = (name: string, deps: any[] = []): string => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();

    setValue(val);
  }, [name, typeof document, ...deps]);

  return value;
};

// Re exports
export { buildStyles };
export type { ClassValue, BuildStyles };
