export { createThemeRuntime } from './createThemeRuntime.client.js';
export type { CreateThemeRuntimeOptions, ThemeProviderProps } from './createThemeRuntime.client.js';
export { applyThemeToDocument, mountThemeToDocument, unmountThemeFromDocument } from './dom.js';

/** Re-export when `@lib/theme` is the single integration surface for theme types. */
export type { ExtractThemeName, ExtractDefaultTheme } from '@lib/styles';
