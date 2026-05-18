export type PersistenceMode = 'localStorage' | 'cookie';

export type ResolvePersistenceModeOptions = {
  persistenceMode?: PersistenceMode;
  /** Env var name (e.g. `REACT33_THEME_PERSISTENCE`, `NEXT_PUBLIC_REACT33_THEME_PERSISTENCE`). */
  persistenceEnvKey?: string;
  /** Explicit env map (tests); defaults to {@link readClientEnv}. */
  env?: Record<string, string | undefined>;
};

/**
 * Reads env from `process.env` (Node/Next) and/or `import.meta.env` (Vite).
 * Later sources override earlier ones when both exist.
 */
export function readClientEnv(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  if (typeof process !== 'undefined' && process.env) {
    Object.assign(out, process.env as Record<string, string | undefined>);
  }
  try {
    const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
    if (meta.env) Object.assign(out, meta.env);
  } catch {
    /* no import.meta */
  }
  return out;
}

/** Resolves active persistence backend: env override → config → `localStorage`. */
export function resolvePersistenceMode(options: ResolvePersistenceModeOptions): PersistenceMode {
  const env = options.env ?? readClientEnv();
  if (options.persistenceEnvKey) {
    const raw = env[options.persistenceEnvKey];
    if (raw === 'cookie' || raw === 'localStorage') return raw;
  }
  if (options.persistenceMode === 'cookie' || options.persistenceMode === 'localStorage') {
    return options.persistenceMode;
  }
  return 'localStorage';
}
