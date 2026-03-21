import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';

/** Filenames searched upward from cwd until filesystem root. */
export const LIB_STYLES_CONFIG_FILENAMES = [
  '.lib.config.json',
  'lib.config.json',
  'lib-styles.config.json',
] as const;

/**
 * `libStyles` section inside `lib.config.json` / `lib-styles.config.json`.
 * Paths are resolved relative to the config file directory (same idea as tsconfig).
 */
export type LibStylesConfigSection = {
  /** Directory containing `*.css` sources. */
  fromCss?: string;
  /**
   * Cascade order (stems without `.css`).
   * Omit to compile **every** `*.css` in `fromCss`, sorted **A–Z** by filename (locale: en, base sensitivity).
   */
  domainsOrder?: string[];
  /** Single output path for the generated `.ts` file. */
  output?: string;
  /** Directory for the generated file (used with `outputFile`). */
  outputDir?: string;
  /** Default: `styles.generated.ts` */
  outputFile?: string;
  /**
   * Stems (file names without `.css`) skipped when **auto-discovering** domains.
   * Ignored when `domainsOrder` is set.
   */
  excludeStems?: string[];
  /** First line(s) of the generated `.ts` (replaces the default “Auto-generated…” banner). */
  banner?: string;
  /** Log resolved config path, `fromCss`, domain order, and output path. */
  verbose?: boolean;
  /**
   * Which CSS file supplies `@theme` meta (`--theme-default`, `--theme-cols`) and cols fallback.
   * Default: domain stem `tokens`, else first file in cascade order.
   */
  metaSourceStem?: string;
  /**
   * Watch `fromCss` and regenerate on change (same as CLI `--watch`).
   * CLI `--watch` wins when passed.
   */
  watch?: boolean;
};

export type LibConfigJson = {
  /** JSON Schema URL/path for IDE autocomplete */
  $schema?: string;
  libStyles?: LibStylesConfigSection;
};

export function findLibStylesConfigFile(startDir: string): string | null {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;
  while (true) {
    for (const name of LIB_STYLES_CONFIG_FILENAMES) {
      const p = path.join(dir, name);
      if (existsSync(p)) return p;
    }
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  return null;
}

export function loadLibStylesConfigJson(filePath: string): LibConfigJson {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as LibConfigJson;
}

/**
 * Stems of every `*.css` in `dir`, excluding `*.generated.css`, sorted alphabetically (en, base).
 * `excludeStems` removes matching stems (exact match on basename without `.css`).
 */
export function discoverCssStemsInDir(dir: string, excludeStems?: string[]): string[] {
  if (!existsSync(dir)) return [];
  const exclude = new Set(excludeStems ?? []);
  const names = readdirSync(dir);
  const stems = names
    .filter((f) => f.endsWith('.css') && !f.endsWith('.generated.css'))
    .map((f) => path.basename(f, '.css'))
    .filter((stem) => !exclude.has(stem));
  stems.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return stems;
}

export function resolvePathFromConfigBase(relOrAbs: string, configDir: string, cwd: string): string {
  if (path.isAbsolute(relOrAbs)) return relOrAbs;
  return path.resolve(configDir, relOrAbs);
}
