export type React33I18nConfig = {
  defaultLocale: string;
  locales: string[];
  localesDirectory: string;
  generatedTypesOutput?: string;
  generatedRuntimeOutput?: string;
  runtimeMode?: 'spa' | 'next';
  cookieName?: string;
  localStorageKey?: string;
  persistenceMode?: 'localStorage' | 'cookie';
  persistenceEnvKey?: string;
  urlLocalePattern?: string;
};

export function readReact33I18nConfig(json: unknown): React33I18nConfig | null {
  if (!json || typeof json !== 'object') return null;
  const section = (json as Record<string, unknown>).react33I18n;
  if (!section || typeof section !== 'object') return null;
  const cfg = section as Record<string, unknown>;
  const defaultLocale = cfg.defaultLocale;
  const locales = cfg.locales;
  const localesDirectory = cfg.localesDirectory;
  if (typeof defaultLocale !== 'string' || !Array.isArray(locales) || locales.length === 0) {
    return null;
  }
  if (typeof localesDirectory !== 'string') return null;
  if (!locales.every((l) => typeof l === 'string')) return null;

  return {
    defaultLocale,
    locales,
    localesDirectory,
    ...(typeof cfg.generatedTypesOutput === 'string'
      ? { generatedTypesOutput: cfg.generatedTypesOutput }
      : {}),
    ...(typeof cfg.generatedRuntimeOutput === 'string'
      ? { generatedRuntimeOutput: cfg.generatedRuntimeOutput }
      : {}),
    ...(cfg.runtimeMode === 'spa' || cfg.runtimeMode === 'next'
      ? { runtimeMode: cfg.runtimeMode }
      : {}),
    ...(typeof cfg.cookieName === 'string' ? { cookieName: cfg.cookieName } : {}),
    ...(typeof cfg.localStorageKey === 'string'
      ? { localStorageKey: cfg.localStorageKey }
      : {}),
    ...(cfg.persistenceMode === 'localStorage' || cfg.persistenceMode === 'cookie'
      ? { persistenceMode: cfg.persistenceMode }
      : {}),
    ...(typeof cfg.persistenceEnvKey === 'string'
      ? { persistenceEnvKey: cfg.persistenceEnvKey }
      : {}),
    ...(typeof cfg.urlLocalePattern === 'string'
      ? { urlLocalePattern: cfg.urlLocalePattern }
      : {}),
  };
}
