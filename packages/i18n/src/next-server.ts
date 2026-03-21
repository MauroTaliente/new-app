import 'server-only';

import { pickScope } from './pick.js';
import type { PickSegment } from './types.js';

/**
 * Load one locale with dynamic imports, then pick scope(s) (Server Components / RSC).
 */
export async function getLocaleAsync<
  Locale extends string,
  Structure extends Record<string, unknown>,
>(
  loaders: Record<Locale, () => Promise<Structure>>,
  scope: keyof Structure | readonly (keyof Structure)[],
  lang: string | undefined,
  fallbackLocale: Locale,
): Promise<PickSegment<Structure, typeof scope>> {
  const loc =
    lang !== undefined && lang !== null && lang in loaders ? (lang as Locale) : fallbackLocale;
  const structure = await loaders[loc]();
  return pickScope(structure, scope as keyof Structure | readonly (keyof Structure)[]);
}
