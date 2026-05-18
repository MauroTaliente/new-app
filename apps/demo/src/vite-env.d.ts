/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Overrides `react33Theme.persistenceMode` (default env key from codegen). */
  readonly REACT33_THEME_PERSISTENCE?: 'localStorage' | 'cookie';
  /** Overrides `react33I18n.persistenceMode` (default env key from codegen). */
  readonly REACT33_I18N_PERSISTENCE?: 'localStorage' | 'cookie';
}
