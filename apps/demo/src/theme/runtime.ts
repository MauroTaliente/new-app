import { createThemeRuntime } from '@maurotaliente/react-theme';
import { styles, type ThemeName } from './styles.generated';

/**
 * Runtime de tema tipado con `ThemeName` emitido por `react-styles-generate`.
 * Equivalente: `type ThemeName = ExtractThemeName<typeof styles>` desde `@maurotaliente/react-theme` / `@maurotaliente/react-styles`.
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
