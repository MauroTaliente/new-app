import { clsx, type ClassValue } from 'clsx';
import { twMerge, type ClassNameValue } from 'tailwind-merge';
import { cva, type VariantProps } from 'class-variance-authority';

import { isArray, isObject } from '@react33/react-helpers';
import { BuildStyles, ProcessedModel } from './module';

/**
 * Merge clsx and tailwind-merge to handle conditional classnames with Tailwind conflict resolution
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

/**
 * Get the value of a CSS variable as a number
 */
export const getCssVariable = (name: string): string => {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

/**
 * Convert a hexadecimal color value (with optional alpha) to a CSS rgba(...) string.
 */
export function hexToRgba(hex: string): string {
  if (!hex.startsWith('#') || (hex.length !== 9 && hex.length !== 7)) return hex;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (hex.length === 9) {
    const a = parseInt(hex.slice(7, 9), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }

  return `rgba(${r}, ${g}, ${b}, 1)`;
}

/**
 * Convert tailwind-style string values like `1rem`, `768px`, or raw `42` into px numbers
 */
export const getValueFromStyleValue = (val: string): number => {
  if (val === 'initial') return 0;
  const rem = val.endsWith('rem') ? parseFloat(val) * 16 : null;
  const px = val.endsWith('px') ? parseFloat(val) : null;
  return rem ?? px ?? parseFloat(val);
};

/**
 * Recursively builds class names from nested objects/arrays, with Tailwind autocompletion.
 */
export function buildStyles<T extends BuildStyles>(data: T): ProcessedModel<T> {
  function runner(value: BuildStyles): any {
    if (isObject(value)) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, runner(v as any)]));
    }
    if (isArray(value)) {
      return cn(...(value as ClassValue[]));
    }
    return cn(value as ClassValue);
  }
  return runner(data);
}

// Re-exports
export { cva };
export type { VariantProps, ClassValue, ClassNameValue };
