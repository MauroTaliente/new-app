export { createThemeRuntime } from './createThemeRuntime.client.js';
export type { CreateThemeRuntimeOptions, ThemeProviderProps } from './createThemeRuntime.client.js';
export { applyThemeToDocument, mountThemeToDocument, unmountThemeFromDocument } from './dom.js';

/** Re-export when `@maurotaliente/react-theme` is the single integration surface for theme types. */
export type { ExtractThemeName, ExtractDefaultTheme } from '@maurotaliente/react-styles';
