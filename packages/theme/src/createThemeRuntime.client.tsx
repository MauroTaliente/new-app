'use client';

import { useEffect, type ReactNode } from 'react';
import { newContext } from '@lib/context';
import { applyThemeToDocument, mountThemeToDocument, unmountThemeFromDocument } from './dom.js';

export type CreateThemeRuntimeOptions<T extends string> = {
  /** Default theme (e.g. `styles.meta.defaultTheme`). */
  defaultTheme: T;
};

export type ThemeProviderProps<T extends string> = {
  children: ReactNode;
  /** Initial state; falls back to the runtime `defaultTheme` when omitted. */
  value?: T;
  /** After every theme change (including first commit). Persistence, analytics, etc. */
  onThemeChange?: (theme: T) => void;
};

/**
 * Creates typed Provider, hooks, and DOM sync for the theme union from generated CSS.
 *
 * @example
 * ```tsx
 * import { createThemeRuntime } from '@lib/theme';
 * import { styles, type ThemeName } from './theme/styles.generated';
 *
 * const theme = createThemeRuntime<ThemeName>({ defaultTheme: styles.meta.defaultTheme });
 * export const { ThemeProvider, useTheme, ThemeBodySync } = theme;
 * ```
 */
export function createThemeRuntime<T extends string>(options: CreateThemeRuntimeOptions<T>) {
  const { defaultTheme } = options;

  const ctx = newContext<{
    name: 'theme';
    initValues: T;
    reducer: (prev: T, next: T) => T;
  }>({
    name: 'theme',
    initValues: defaultTheme,
    reducer: (prev, next) => {
      if (typeof document !== 'undefined' && prev !== next) {
        applyThemeToDocument(prev, next);
      }
      return next;
    },
  });

  const RawProvider = ctx.ThemeProvider;
  const useThemeState = ctx.useThemeState;
  const useThemeUpdater = ctx.useThemeUpdater;

  function ThemeOnChangeEffect({ onThemeChange }: { onThemeChange?: (t: T) => void }) {
    const theme = useThemeState();
    useEffect(() => {
      onThemeChange?.(theme);
    }, [theme, onThemeChange]);
    return null;
  }

  function ThemeProvider({ children, value, onThemeChange }: ThemeProviderProps<T>) {
    return (
      <RawProvider value={value}>
        {onThemeChange ? <ThemeOnChangeEffect onThemeChange={onThemeChange} /> : null}
        {children}
      </RawProvider>
    );
  }

  function useTheme(): readonly [T, (next: T) => void] {
    const state = useThemeState();
    const updater = useThemeUpdater();
    return [state, updater] as const;
  }

  function ThemeBodySync() {
    const theme = useThemeState();
    useEffect(() => {
      mountThemeToDocument(theme);
      return () => {
        unmountThemeFromDocument(theme);
      };
    }, [theme]);
    return null;
  }

  return {
    ThemeProvider,
    ThemeBodySync,
    useThemeState,
    useThemeUpdater,
    useTheme,
    /** Default passed when creating the runtime (same reference as context initial state). */
    defaultTheme,
  } as const;
}
