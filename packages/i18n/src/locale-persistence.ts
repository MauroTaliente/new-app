import {
  resolvePersistenceMode,
  setCookie,
  setLocalStorage,
  type PersistenceMode,
} from '@react33/react-persistence';
import { resolveInitialLocale, type ResolveInitialLocaleOptions } from './browser.js';

export type LocalePersistenceMode = PersistenceMode;

export type CreateLocalePersistenceOptions = {
  defaultLocale: string;
  allowedLocales: readonly string[];
  persistenceMode?: LocalePersistenceMode;
  cookieName?: string;
  localStorageKey?: string;
  urlLocalePattern?: string | RegExp;
  persistenceEnvKey?: string;
  env?: Record<string, string | undefined>;
  cookiePath?: string;
  cookieMaxAgeSeconds?: number;
  cookieSameSite?: 'strict' | 'lax' | 'none';
};

function toRegExp(pattern: string | RegExp | undefined): RegExp | undefined {
  if (!pattern) return undefined;
  if (pattern instanceof RegExp) return pattern;
  return new RegExp(pattern);
}

/**
 * Persistence helpers that honor a single active backend (cookie or localStorage).
 */
export function createLocalePersistence(options: CreateLocalePersistenceOptions) {
  const {
    defaultLocale,
    allowedLocales,
    cookieName,
    localStorageKey,
    urlLocalePattern,
    cookiePath = '/',
    cookieMaxAgeSeconds = 60 * 60 * 24 * 365,
    cookieSameSite = 'lax',
  } = options;

  const cookieKey = cookieName ?? localStorageKey ?? 'locale';
  const storageKey = localStorageKey ?? cookieName ?? 'locale';

  const persistenceMode = resolvePersistenceMode({
    persistenceMode: options.persistenceMode,
    persistenceEnvKey: options.persistenceEnvKey,
    env: options.env,
  });

  const storageKeyLabel =
    persistenceMode === 'localStorage' ? storageKey : cookieKey;

  function buildResolveOptions(
    overrides?: Partial<ResolveInitialLocaleOptions>,
  ): ResolveInitialLocaleOptions {
    const base: ResolveInitialLocaleOptions = {
      defaultLocale,
      allowedLocales,
      urlLocalePattern: toRegExp(urlLocalePattern),
      ...overrides,
    };
    if (persistenceMode === 'localStorage') {
      base.localStorageKey = storageKey;
    } else {
      base.cookieName = cookieKey;
    }
    return base;
  }

  function getInitialLocale(overrides?: Partial<ResolveInitialLocaleOptions>): string {
    if (typeof window === 'undefined') return defaultLocale;
    return resolveInitialLocale(
      buildResolveOptions({
        pathname: window.location.pathname,
        ...overrides,
      }),
    );
  }

  function persistLocale(locale: string): void {
    if (typeof window === 'undefined') return;
    if (persistenceMode === 'localStorage') {
      setLocalStorage({ name: storageKey, params: locale });
      return;
    }
    setCookie({
      name: cookieKey,
      params: locale,
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
    getInitialLocale,
    persistLocale,
    buildResolveOptions,
  } as const;
}
