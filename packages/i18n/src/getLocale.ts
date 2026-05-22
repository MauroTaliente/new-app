import { pickScope } from './pick.js';
import type { PickSegment } from './types.js';

function resolveLang<Locale extends string>(
  dictionaries: Record<Locale, unknown>,
  lang: string | null | undefined,
  fallbackLocale: Locale,
): Locale {
  if (lang !== undefined && lang !== null && lang in dictionaries) {
    return lang as Locale;
  }
  return fallbackLocale;
}

/**
 * Resolve translated segment(s) for a locale key using synchronous dictionaries.
 */
export function getLocale<
  Locale extends string,
  Structure extends Record<string, unknown>,
>(
  dictionaries: Record<Locale, Structure>,
  lang: string | null | undefined,
  fallbackLocale: Locale,
  scope: keyof Structure | readonly (keyof Structure)[],
): PickSegment<Structure, typeof scope> {
  const loc = resolveLang(dictionaries, lang, fallbackLocale);
  const structure = dictionaries[loc];
  return pickScope(structure, scope as keyof Structure | readonly (keyof Structure)[]);
}

/** Full structure for one locale (one language root object). */
export function getAllLocale<
  Locale extends string,
  Structure extends Record<string, unknown>,
>(
  dictionaries: Record<Locale, Structure>,
  lang: string | null | undefined,
  fallbackLocale: Locale,
): Structure {
  const loc = resolveLang(dictionaries, lang, fallbackLocale);
  return dictionaries[loc];
}
