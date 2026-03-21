import { createThemeRuntime } from '@lib/theme';
import { styles, type ThemeName } from './styles.generated';

/**
 * Runtime de tema tipado con `ThemeName` emitido por `lib-styles-generate`.
 * Equivalente: `type ThemeName = ExtractThemeName<typeof styles>` desde `@lib/theme` / `@lib/styles`.
 */
export const {
  ThemeProvider,
  ThemeBodySync,
  useTheme,
  useThemeState,
  useThemeUpdater,
} = createThemeRuntime<ThemeName>({
  defaultTheme: styles.meta.defaultTheme,
});
