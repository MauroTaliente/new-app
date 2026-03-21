/**
 * Persistencia del tema: `libTheme` en lib.config (misma convención que `libI18n`).
 *
 * Override: `VITE_THEME_PERSISTENCE=cookie` | `localStorage` (p. ej. probar sin tocar lib.config).
 */
import { getCookie, getLocalStorage, setCookie, setLocalStorage } from '@maurotaliente/react-persistence';
import type { ThemeName } from './styles.generated';
import libConfig from '../../lib.config.json';

type LibTheme = {
  cookieName?: string;
  localStorageKey?: string;
  persistenceMode?: 'localStorage' | 'cookie';
  cookiePath?: string;
  cookieMaxAgeSeconds?: number;
  cookieSameSite?: 'strict' | 'lax' | 'none';
};

const libTheme = (libConfig as { libTheme?: LibTheme }).libTheme;

const cookieKey = libTheme?.cookieName ?? libTheme?.localStorageKey ?? 'demo-theme';
const storageKey = libTheme?.localStorageKey ?? libTheme?.cookieName ?? 'demo-theme';

export type ThemePersistenceMode = 'localStorage' | 'cookie';

function resolveMode(): ThemePersistenceMode {
  const raw = import.meta.env.VITE_THEME_PERSISTENCE;
  if (raw === 'cookie' || raw === 'localStorage') return raw;
  if (libTheme?.persistenceMode === 'cookie' || libTheme?.persistenceMode === 'localStorage') {
    return libTheme.persistenceMode;
  }
  return 'localStorage';
}

export const THEME_PERSISTENCE_MODE: ThemePersistenceMode = resolveMode();

/** Clave activa según modo (logs / depuración). */
export const THEME_STORAGE_KEY =
  THEME_PERSISTENCE_MODE === 'localStorage' ? storageKey : cookieKey;

/** Tema inicial: lee storage/cookie o devuelve el default del CSS generado. */
export function getInitialTheme(defaultTheme: ThemeName): ThemeName {
  if (typeof window === 'undefined') return defaultTheme;
  if (THEME_PERSISTENCE_MODE === 'localStorage') {
    return getLocalStorage<ThemeName>({ name: storageKey, initData: defaultTheme });
  }
  return getCookie<ThemeName>({ name: cookieKey, initData: defaultTheme }) ?? defaultTheme;
}

/** Persiste tras cada cambio de tema (p. ej. desde ThemeBodySync). */
export function persistTheme(theme: ThemeName): void {
  if (THEME_PERSISTENCE_MODE === 'localStorage') {
    setLocalStorage({ name: storageKey, params: theme });
    return;
  }
  setCookie({
    name: cookieKey,
    params: theme,
    writeOptions: {
      path: libTheme?.cookiePath ?? '/',
      maxAge: libTheme?.cookieMaxAgeSeconds ?? 60 * 60 * 24 * 365,
      sameSite: libTheme?.cookieSameSite ?? 'lax',
    },
  });
}
