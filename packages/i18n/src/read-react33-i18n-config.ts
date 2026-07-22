/**
 * Parser for the `react33I18n` block of `react33.config.json`.
 *
 * Single-or-collection (additive, like `react33Session`):
 * - **Flat** — `react33I18n: { defaultLocale, locales, localesDir, … }` is one
 *   bundle (the original form, unchanged).
 * - **Collection** — `react33I18n: { bundles: { app: {…}, ui: {…} } }` is N
 *   independent bundles; each map key is lifted onto the config as `name`. Use
 *   it to emit separate dictionaries (e.g. app copy vs. a portable UI kit) that
 *   never share a `Structure` type or a runtime.
 *
 * Pure: takes already-parsed JSON, returns normalized configs — no filesystem.
 */

export type React33I18nConfig = {
  /** Map key when from a `bundles` collection; undefined for the flat form. */
  name?: string;
  defaultLocale: string;
  locales: string[];
  localesDir: string;
  typesOutput?: string;
  runtimeOutput?: string;
  runtimeMode?: 'spa' | 'next';
  cookieName?: string;
  localStorageKey?: string;
  persistenceMode?: 'localStorage' | 'cookie';
  persistenceEnvKey?: string;
  urlLocalePattern?: string;
};

/** Validate + normalize one bundle. Returns null when the required fields are missing. */
function readOneI18nConfig(
  cfg: Record<string, unknown>,
  name?: string,
): React33I18nConfig | null {
  const defaultLocale = cfg.defaultLocale;
  const locales = cfg.locales;
  const localesDir = cfg.localesDir;
  if (
    typeof defaultLocale !== 'string' ||
    !Array.isArray(locales) ||
    locales.length === 0
  ) {
    return null;
  }
  if (typeof localesDir !== 'string') return null;
  if (!locales.every((l) => typeof l === 'string')) return null;

  return {
    // `name` is only present for collection bundles — the flat form stays
    // byte-identical to the pre-collection output (back-compat).
    ...(name ? { name } : {}),
    defaultLocale,
    locales,
    localesDir,
    ...(typeof cfg.typesOutput === 'string'
      ? { typesOutput: cfg.typesOutput }
      : {}),
    ...(typeof cfg.runtimeOutput === 'string'
      ? { runtimeOutput: cfg.runtimeOutput }
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

/**
 * All i18n bundles declared in the config. Flat form → one entry; `bundles`
 * map → one entry per key (in declaration order). Returns null when the
 * `react33I18n` block is absent (the generator then skips). Throws on a
 * `bundles` entry that is present but malformed, so a bad config fails loudly.
 */
export function readReact33I18nConfigs(json: unknown): React33I18nConfig[] | null {
  if (!json || typeof json !== 'object') return null;
  const section = (json as Record<string, unknown>).react33I18n;
  if (!section || typeof section !== 'object') return null;
  const cfg = section as Record<string, unknown>;

  const bundles = cfg.bundles;
  if (bundles && typeof bundles === 'object' && !Array.isArray(bundles)) {
    const out: React33I18nConfig[] = [];
    for (const [name, raw] of Object.entries(
      bundles as Record<string, unknown>,
    )) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error(`react33I18n.bundles.${name}: expected an object.`);
      }
      const one = readOneI18nConfig(raw as Record<string, unknown>, name);
      if (!one) {
        throw new Error(
          `react33I18n.bundles.${name}: invalid — needs defaultLocale (string), non-empty locales (string[]) and localesDir (string).`,
        );
      }
      out.push(one);
    }
    return out.length > 0 ? out : null;
  }

  const one = readOneI18nConfig(cfg);
  return one ? [one] : null;
}

/**
 * The first/primary i18n bundle (or the sole flat config). Kept for
 * back-compat; prefer {@link readReact33I18nConfigs} to handle collections.
 */
export function readReact33I18nConfig(json: unknown): React33I18nConfig | null {
  const all = readReact33I18nConfigs(json);
  return all ? (all[0] ?? null) : null;
}
