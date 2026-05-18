import {
  getCookie,
  getLocalStorage,
  resolvePersistenceMode,
  setCookie,
  setLocalStorage,
  type PersistenceMode,
} from '@react33/react-persistence';

export type ThemePersistenceMode = PersistenceMode;

export type CreateThemePersistenceOptions<T extends string> = {
  defaultTheme: T;
  persistenceMode?: ThemePersistenceMode;
  cookieName?: string;
  localStorageKey?: string;
  persistenceEnvKey?: string;
  env?: Record<string, string | undefined>;
  cookiePath?: string;
  cookieMaxAgeSeconds?: number;
  cookieSameSite?: 'strict' | 'lax' | 'none';
};

export function createThemePersistence<T extends string>(
  options: CreateThemePersistenceOptions<T>,
) {
  const {
    defaultTheme,
    cookieName,
    localStorageKey,
    cookiePath = '/',
    cookieMaxAgeSeconds = 60 * 60 * 24 * 365,
    cookieSameSite = 'lax',
  } = options;

  const cookieKey = cookieName ?? localStorageKey ?? 'theme';
  const storageKey = localStorageKey ?? cookieName ?? 'theme';

  const persistenceMode = resolvePersistenceMode({
    persistenceMode: options.persistenceMode,
    persistenceEnvKey: options.persistenceEnvKey,
    env: options.env,
  });

  const storageKeyLabel =
    persistenceMode === 'localStorage' ? storageKey : cookieKey;

  function getInitialTheme(): T {
    if (typeof window === 'undefined') return defaultTheme;
    if (persistenceMode === 'localStorage') {
      return getLocalStorage<T>({ name: storageKey, initData: defaultTheme });
    }
    return getCookie<T>({ name: cookieKey, initData: defaultTheme }) ?? defaultTheme;
  }

  function persistTheme(theme: T): void {
    if (typeof window === 'undefined') return;
    if (persistenceMode === 'localStorage') {
      setLocalStorage({ name: storageKey, params: theme });
      return;
    }
    setCookie({
      name: cookieKey,
      params: theme,
      writeOptions: {
        path: cookiePath,
        maxAge: cookieMaxAgeSeconds,
        sameSite: cookieSameSite,
      },
    });
  }

  return {
    persistenceMode,
    storageKey: storageKeyLabel,
    getInitialTheme,
    persistTheme,
  } as const;
}
