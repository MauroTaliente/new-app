/**
 * Helpers para acoplar tipos al objeto `styles` emitido por `react-styles-generate`.
 *
 * @example
 * ```ts
 * import { styles } from './theme/styles.generated';
 * import type { ExtractThemeName } from '@react33/react-styles';
 * type ThemeName = ExtractThemeName<typeof styles>;
 * ```
 */
export type ExtractThemeName<S extends { meta: { themeModes: readonly string[] } }> =
  S['meta']['themeModes'][number];

export type ExtractDefaultTheme<S extends { meta: { defaultTheme: string } }> = S['meta']['defaultTheme'];
