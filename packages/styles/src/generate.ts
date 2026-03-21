import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseStylesFromDomains } from './css/parseStylesFromCss.js';
import { collectAllVarMaps } from './css/collectVarMaps.js';
import { applyResolvedVarValues } from './css/resolveCssVarValues.js';
import { emitStylesGeneratedModule } from './css/emitStylesGenerated.js';
import { stemToCamelCase } from './css/stemUtils.js';
import {
  discoverCssStemsInDir,
  findLibStylesConfigFile,
  loadLibStylesConfigJson,
  resolvePathFromConfigBase,
  type LibStylesConfigSection,
} from './libStylesConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type GenerateTokensOptions = {
  /**
   * Directory containing `<stem>.css` for each entry in `domains`, or every `*.css` when `domains` is omitted.
   * Defaults to `packages/styles/defaults` when omitted (library shipped defaults).
   */
  fromCssDir?: string;
  /**
   * File stems (without `.css`) in cascade order.
   * Omit (and omit `domainsOrder` in config) to compile **all** `*.css` in `fromCssDir`, sorted A–Z by filename.
   */
  domains?: string[];
  inputTokensCss?: string;
  inputPaletteCss?: string;
  inputThemeCss?: string;
  outputDir?: string;
  /** Default: `<outputDir>/styles.generated.ts` */
  outputStyles?: string;
  /** Absolute path to `lib.config.json` / `lib-styles.config.json` */
  configPath?: string;
  /** Skip loading config files (CLI: `--no-config`) */
  skipConfig?: boolean;
  /** Base directory for finding config and default paths (default `process.cwd()`) */
  cwd?: string;
  /** Log resolved paths and domain order (CLI `--verbose`; overrides config when set) */
  verbose?: boolean;
  /** Override `libStyles.metaSourceStem` from config */
  metaSourceStem?: string;
  /** Override `libStyles.banner` from config */
  banner?: string;
  /**
   * Watch mode (CLI `--watch`). When omitted, `libStyles.watch` from config applies.
   */
  watch?: boolean;
};

export type ResolvedGenerateOptions = {
  fromCssDir: string;
  domains: string[];
  outputStyles: string;
  outputDir: string;
  inputTokensCss?: string;
  inputPaletteCss?: string;
  inputThemeCss?: string;
  configPath?: string;
  /** Passed to `parseStylesFromDomains` for `@theme` meta / cols fallback. */
  metaSourceStem?: string;
  /** First line(s) of generated TS (from config). */
  banner?: string;
  verbose: boolean;
  /** True if CLI `--watch` or config `libStyles.watch` (CLI wins when set). */
  watch: boolean;
};

function getPackageDir(): string {
  return path.resolve(__dirname, '..');
}

export type ResolvedDomainPath = { stem: string; filePath: string };

/**
 * Merges CLI options + `lib.config.json` / `lib-styles.config.json` (`libStyles` section).
 * Paths in config are relative to the **config file directory**.
 *
 * **Order of stems**: CLI `--domains` > config `domainsOrder` > all `*.css` in `fromCss`, **alphabetically** (en).
 */
export function resolveGenerateOptions(options: GenerateTokensOptions = {}): ResolvedGenerateOptions {
  const cwd = options.cwd ?? process.cwd();
  const skipConfig = options.skipConfig === true;

  let configPath: string | undefined = options.configPath;
  if (!skipConfig && !configPath) {
    configPath = findLibStylesConfigFile(cwd) ?? undefined;
  }

  let configSection: LibStylesConfigSection = {};
  let configDir = cwd;
  if (!skipConfig && configPath && existsSync(configPath)) {
    const json = loadLibStylesConfigJson(configPath);
    configSection = json.libStyles ?? {};
    configDir = path.dirname(path.resolve(configPath));
  }

  const pkgDir = getPackageDir();
  const defaultDir = path.join(pkgDir, 'defaults');

  const fromCssDir = path.resolve(
    options.fromCssDir ??
      (configSection.fromCss ? resolvePathFromConfigBase(configSection.fromCss, configDir, cwd) : undefined) ??
      defaultDir,
  );

  let domains: string[] | undefined;
  const explicitFromCli = options.domains !== undefined && options.domains.length > 0;
  const explicitFromConfig =
    !skipConfig && configSection.domainsOrder !== undefined && configSection.domainsOrder.length > 0;

  if (explicitFromCli) {
    domains = options.domains!;
  } else if (explicitFromConfig) {
    domains = configSection.domainsOrder!;
  } else {
    /** Package shipped defaults: fixed cascade (not A–Z — that would break var() resolution). */
    const isPackageDefaults = path.resolve(fromCssDir) === path.resolve(defaultDir);
    if (isPackageDefaults) {
      domains = ['tokens', 'palette', 'theme'];
    } else {
      domains = discoverCssStemsInDir(fromCssDir, configSection.excludeStems);
      if (domains.length === 0) {
        throw new Error(
          `[lib-styles-generate] No *.css files in ${fromCssDir}\n` +
            'Add CSS files, set `libStyles.domainsOrder` in lib.config.json, or pass --domains <stems>.',
        );
      }
    }
  }

  const outputFileName = configSection.outputFile ?? 'styles.generated.ts';

  let outputStyles: string | undefined;
  if (options.outputStyles) {
    outputStyles = path.isAbsolute(options.outputStyles)
      ? options.outputStyles
      : path.resolve(cwd, options.outputStyles);
  } else if (options.outputDir) {
    outputStyles = path.join(options.outputDir, outputFileName);
  } else if (configSection.output) {
    outputStyles = resolvePathFromConfigBase(configSection.output, configDir, cwd);
  } else if (configSection.outputDir) {
    outputStyles = path.join(
      resolvePathFromConfigBase(configSection.outputDir, configDir, cwd),
      outputFileName,
    );
  } else {
    outputStyles = path.join(cwd, outputFileName);
  }

  if (!outputStyles) {
    outputStyles = path.join(cwd, outputFileName);
  }

  const outputDir = path.dirname(outputStyles);

  const verbose = options.verbose ?? configSection.verbose ?? false;
  const metaSourceStem =
    options.metaSourceStem ?? (!skipConfig ? configSection.metaSourceStem : undefined);
  const banner = options.banner ?? (!skipConfig ? configSection.banner : undefined);
  const watch = options.watch ?? configSection.watch ?? false;

  return {
    fromCssDir,
    domains,
    outputStyles,
    outputDir,
    inputTokensCss: options.inputTokensCss,
    inputPaletteCss: options.inputPaletteCss,
    inputThemeCss: options.inputThemeCss,
    configPath: configPath ? path.resolve(configPath) : undefined,
    metaSourceStem,
    banner,
    verbose,
    watch,
  };
}

function resolveDomainPaths(merged: ResolvedGenerateOptions): ResolvedDomainPath[] {
  const { fromCssDir, domains } = merged;

  const legacyOverride: Record<string, string | undefined> = {
    tokens: merged.inputTokensCss,
    palette: merged.inputPaletteCss,
    theme: merged.inputThemeCss,
  };

  return domains.map((stem) => ({
    stem,
    filePath: legacyOverride[stem] ?? path.join(fromCssDir, `${stem}.css`),
  }));
}

function assertReadable(filePath: string, label: string): void {
  if (!existsSync(filePath)) {
    throw new Error(
      `[lib-styles-generate] Missing ${label}: ${filePath}\n` +
        'Check `libStyles.domainsOrder` / file names, or pass --from-css <dir> with matching <stem>.css files.',
    );
  }
}

/**
 * Reads source CSS files and emits `styles.generated.ts` (nested by `-`, theme modes by class, `meta`, per-domain keys).
 * Resolves `var(--*)` to literals when the chain is declared in the same CSS inputs.
 *
 * Configuration: optional `lib.config.json` or `lib-styles.config.json` with a `libStyles` section (see `resolveGenerateOptions`).
 */
export async function generateTokens(options: GenerateTokensOptions = {}): Promise<void> {
  const merged = resolveGenerateOptions(options);
  const resolved = resolveDomainPaths(merged);
  const orderedStems = resolved.map((r) => r.stem);

  for (const { stem, filePath } of resolved) {
    assertReadable(filePath, `${stem}.css`);
  }

  const outStyles = merged.outputStyles;

  const domainInputs = await Promise.all(
    resolved.map(async ({ stem, filePath }) => ({
      stem,
      css: await readFile(filePath, 'utf-8'),
      from: filePath,
    })),
  );

  const parsed = parseStylesFromDomains({
    domains: domainInputs,
    metaSourceStem: merged.metaSourceStem,
  });
  const maps = collectAllVarMaps({ domains: domainInputs });
  const parsedStyles = applyResolvedVarValues(parsed, maps, orderedStems);

  const domainOrder = orderedStems.map(stemToCamelCase);

  if (merged.verbose) {
    console.log('[lib-styles-generate] Resolved:');
    if (merged.configPath) console.log('  config:', merged.configPath);
    console.log('  fromCss:', merged.fromCssDir);
    console.log('  domains (cascade):', orderedStems.join(' → '));
    console.log('  output:', outStyles);
  }

  await mkdir(path.dirname(outStyles), { recursive: true });
  await writeFile(
    outStyles,
    emitStylesGeneratedModule(parsedStyles, {
      domainOrder,
      banner: merged.banner,
    }),
  );

  console.log('Generated from CSS:');
  console.log('  -', outStyles);
}

export { parseStylesFromFiles, parseStylesFromDomains, parseStylesDomain } from './css/parseStylesFromCss.js';
export type {
  ParsedStylesDomains,
  ParsedStylesBundle,
  CssDomainInput,
  ParseDomainKind,
  StylesThemeNested,
  StylesMeta,
} from './css/parseStylesFromCss.js';
export { emitStylesGeneratedModule } from './css/emitStylesGenerated.js';
export { cssVarToKey } from './css/cssVarToKey.js';
export type { StylesNestedTree, ParsedMeta } from './css/nestedCssVars.js';
export { collectAllVarMaps } from './css/collectVarMaps.js';
export type { CssVarMap, ResolvedVarMaps, VarMapsByStem } from './css/collectVarMaps.js';
export { applyResolvedVarValues, parseSimpleVar } from './css/resolveCssVarValues.js';
export { stemToCamelCase } from './css/stemUtils.js';
export {
  discoverCssStemsInDir,
  findLibStylesConfigFile,
  loadLibStylesConfigJson,
  LIB_STYLES_CONFIG_FILENAMES,
} from './libStylesConfig.js';
export type { LibStylesConfigSection, LibConfigJson } from './libStylesConfig.js';
