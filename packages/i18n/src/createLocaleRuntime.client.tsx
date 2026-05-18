'use client';

import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { newContext } from '@react33/react-context';
import { formatMessage, type MessageValues } from './formatMessage.js';
import { getAllLocale, getLocale } from './getLocale.js';
import type { PickSegment } from './types.js';

export type CreateLocaleRuntimeOptions<
  Locale extends string,
  Structure extends Record<string, unknown>,
> = {
  defaultLocale: Locale;
  dictionaries: Record<Locale, Structure>;
};

export type LocaleProviderProps<Locale extends string> = {
  children: ReactNode;
  value?: Locale;
  onLocaleChange?: (locale: Locale) => void;
};

export type LocaleRuntime<
  Locale extends string,
  Structure extends Record<string, unknown>,
> = {
  LocaleProvider: (props: LocaleProviderProps<Locale>) => ReactNode;
  useLocaleState: () => Locale;
  useLocaleUpdater: () => (next: Locale) => void;
  useLocale: () => readonly [Locale, (next: Locale) => void];
  useDict: <T extends keyof Structure | readonly (keyof Structure)[]>(
    scope: T,
  ) => PickSegment<Structure, T>;
  useTf: <T extends keyof Structure>(
    scope: T,
  ) => (key: keyof PickSegment<Structure, T> & string, values?: MessageValues) => string;
  useAllLocale: () => Structure;
  defaultLocale: Locale;
  dictionaries: Record<Locale, Structure>;
};

/**
 * Creates typed Provider and hooks for SPA locale switching with in-memory dictionaries.
 */
export function createLocaleRuntime<
  Locale extends string,
  Structure extends Record<string, unknown>,
>(options: CreateLocaleRuntimeOptions<Locale, Structure>): LocaleRuntime<Locale, Structure> {
  const { defaultLocale, dictionaries } = options;

  const ctx = newContext<{
    name: 'locale';
    initValues: Locale;
    reducer: (prev: Locale, next: Locale) => Locale;
  }>({
    name: 'locale',
    initValues: defaultLocale,
    reducer: (_prev, next) => next,
  });

  const RawProvider = ctx.LocaleProvider;
  const useLocaleState = ctx.useLocaleState;
  const useLocaleUpdater = ctx.useLocaleUpdater;

  function LocaleOnChangeEffect({ onLocaleChange }: { onLocaleChange?: (l: Locale) => void }) {
    const locale = useLocaleState();
    useEffect(() => {
      onLocaleChange?.(locale);
    }, [locale, onLocaleChange]);
    return null;
  }

  function LocaleProvider({ children, value, onLocaleChange }: LocaleProviderProps<Locale>) {
    return (
      <RawProvider value={value}>
        {onLocaleChange ? <LocaleOnChangeEffect onLocaleChange={onLocaleChange} /> : null}
        {children}
      </RawProvider>
    );
  }

  function useLocale(): readonly [Locale, (next: Locale) => void] {
    const state = useLocaleState();
    const updater = useLocaleUpdater();
    return [state, updater] as const;
  }

  function useDict<T extends keyof Structure | readonly (keyof Structure)[]>(
    scope: T,
  ): PickSegment<Structure, T> {
    const [locale] = useLocale();
    return useMemo(
      () => getLocale(dictionaries, locale, defaultLocale, scope) as PickSegment<Structure, T>,
      [locale, scope],
    );
  }

  function useAllLocale(): Structure {
    const [locale] = useLocale();
    return useMemo(
      () => getAllLocale(dictionaries, locale, defaultLocale),
      [locale],
    );
  }

  function useTf<T extends keyof Structure>(scope: T) {
    const locale = useLocaleState();
    const segment = useDict(scope);
    return useCallback(
      (key: keyof PickSegment<Structure, T> & string, values?: MessageValues) => {
        const block = segment as Record<string, string>;
        const pattern = block[key];
        if (pattern === undefined) return String(key);
        return formatMessage(locale, pattern, values);
      },
      [locale, segment],
    );
  }

  return {
    LocaleProvider,
    useLocaleState,
    useLocaleUpdater,
    useLocale,
    useDict,
    useTf,
    useAllLocale,
    defaultLocale,
    dictionaries,
  };
}
