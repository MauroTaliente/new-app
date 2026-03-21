/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `localStorage` (default) or `cookie` — see `src/theme/themePersistence.ts` */
  readonly VITE_THEME_PERSISTENCE?: 'localStorage' | 'cookie';
}
