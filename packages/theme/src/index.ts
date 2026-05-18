export { createThemeRuntime } from './createThemeRuntime.client.js';
export type { CreateThemeRuntimeOptions, ThemeProviderProps } from './createThemeRuntime.client.js';
export { createThemePersistence } from './theme-persistence.js';
export type {
  CreateThemePersistenceOptions,
  ThemePersistenceMode,
} from './theme-persistence.js';
export { applyThemeToDocument, mountThemeToDocument, unmountThemeFromDocument } from './dom.js';

/** Re-export when `@react33/react-theme` is the single integration surface for theme types. */
export type { ExtractThemeName, ExtractDefaultTheme } from '@react33/react-styles';
