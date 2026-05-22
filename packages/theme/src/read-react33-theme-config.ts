export type React33ThemeConfig = {
  cookieName?: string;
  localStorageKey?: string;
  persistenceMode?: 'localStorage' | 'cookie';
  persistenceEnvKey?: string;
  cookiePath?: string;
  cookieMaxAgeSeconds?: number;
  cookieSameSite?: 'strict' | 'lax' | 'none';
  runtimeOutput?: string;
  stylesModule?: string;
};

export function readReact33ThemeConfig(json: unknown): React33ThemeConfig | null {
  if (!json || typeof json !== 'object') return null;
  const section = (json as Record<string, unknown>).react33Theme;
  if (!section || typeof section !== 'object') return null;
  const cfg = section as Record<string, unknown>;

  return {
    ...(typeof cfg.cookieName === 'string' ? { cookieName: cfg.cookieName } : {}),
    ...(typeof cfg.localStorageKey === 'string' ? { localStorageKey: cfg.localStorageKey } : {}),
    ...(cfg.persistenceMode === 'localStorage' || cfg.persistenceMode === 'cookie'
      ? { persistenceMode: cfg.persistenceMode }
      : {}),
    ...(typeof cfg.persistenceEnvKey === 'string'
      ? { persistenceEnvKey: cfg.persistenceEnvKey }
      : {}),
    ...(typeof cfg.cookiePath === 'string' ? { cookiePath: cfg.cookiePath } : {}),
    ...(typeof cfg.cookieMaxAgeSeconds === 'number'
      ? { cookieMaxAgeSeconds: cfg.cookieMaxAgeSeconds }
      : {}),
    ...(cfg.cookieSameSite === 'strict' ||
    cfg.cookieSameSite === 'lax' ||
    cfg.cookieSameSite === 'none'
      ? { cookieSameSite: cfg.cookieSameSite }
      : {}),
    ...(typeof cfg.runtimeOutput === 'string'
      ? { runtimeOutput: cfg.runtimeOutput }
      : {}),
    ...(typeof cfg.stylesModule === 'string'
      ? { stylesModule: cfg.stylesModule }
      : {}),
  };
}
