/**
 * Persistencia del tema: `react33Theme` en react33.config (misma convención que `react33I18n`).
 *
 * Override: `VITE_THEME_PERSISTENCE=cookie` | `localStorage` (p. ej. probar sin tocar react33.config).
 */
import { getCookie, getLocalStorage, setCookie, setLocalStorage } from '@react33/react-persistence';
import type { ThemeName } from './styles.generated';
import react33Config from '../../react33.config.json';

type React33Theme = {
  cookieName?: string;
  localStorageKey?: string;
  persistenceMode?: 'localStorage' | 'cookie';
  cookiePath?: string;
  cookieMaxAgeSeconds?: number;
  cookieSameSite?: 'strict' | 'lax' | 'none';
};

const react33Theme = (react33Config as { react33Theme?: React33Theme }).react33Theme;

const cookieKey = react33Theme?.cookieName ?? react33Theme?.localStorageKey ?? 'demo-theme';
const storageKey = react33Theme?.localStorageKey ?? react33Theme?.cookieName ?? 'demo-theme';

export type ThemePersistenceMode = 'localStorage' | 'cookie';

function resolveMode(): ThemePersistenceMode {
  const raw = import.meta.env.VITE_THEME_PERSISTENCE;
  if (raw === 'cookie' || raw === 'localStorage') return raw;
  if (react33Theme?.persistenceMode === 'cookie' || react33Theme?.persistenceMode === 'localStorage') {
    return react33Theme.persistenceMode;
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
      path: react33Theme?.cookiePath ?? '/',
      maxAge: react33Theme?.cookieMaxAgeSeconds ?? 60 * 60 * 24 * 365,
      sameSite: react33Theme?.cookieSameSite ?? 'lax',
    },
  });
}
