'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getAllLocale, getLocale } from './getLocale.js';

export function useLocaleFromParams(options: { paramName?: string } = {}): string | undefined {
  const { paramName = 'lang' } = options;
  const params = useParams();
  const raw = (params as Record<string, string | string[] | undefined>)[paramName];
  if (raw === undefined) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export function useGetLocale<
  Locale extends string,
  Structure extends Record<string, unknown>,
>(
  dictionaries: Record<Locale, Structure>,
  scope: keyof Structure | readonly (keyof Structure)[],
  options: { paramName?: string; fallbackLocale: Locale },
) {
  const lang = useLocaleFromParams(options);
  const { fallbackLocale } = options;
  return useMemo(
    () => getLocale(dictionaries, lang, fallbackLocale, scope),
    [dictionaries, lang, fallbackLocale, scope],
  );
}

export function useGetAllLocale<Locale extends string, Structure extends Record<string, unknown>>(
  dictionaries: Record<Locale, Structure>,
  options: { paramName?: string; fallbackLocale: Locale },
) {
  const lang = useLocaleFromParams(options);
  const { fallbackLocale } = options;
  return useMemo(
    () => getAllLocale(dictionaries, lang, fallbackLocale),
    [dictionaries, lang, fallbackLocale],
  );
}
