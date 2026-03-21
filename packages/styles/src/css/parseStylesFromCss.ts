import postcss from 'postcss';
import {
  type StylesNestedTree,
  type ParsedMeta,
  mergeVarNested,
  parseMetaFromDecl,
  isMetaDeclaration,
} from './nestedCssVars.js';
import { stemToCamelCase } from './stemUtils.js';
import { parseSingleDomainCss } from './parseDomainFile.js';

export type StylesThemeNested = {
  light: StylesNestedTree;
  dark: StylesNestedTree;
};

export type StylesMeta = {
  defaultTheme: string;
  cols: number;
  themeModes: readonly string[];
};

export type ParsedStylesDomains = {
  tokens: StylesNestedTree;
  palette: StylesNestedTree;
  theme: StylesThemeNested;
  meta: StylesMeta;
};

/** Parsed domain value: base tree, theme modes, or hybrid (base + light/dark). */
export type ParsedDomainValue =
  | StylesNestedTree
  | StylesThemeNested
  | (StylesNestedTree & { light: StylesNestedTree; dark: StylesNestedTree });

export type ParsedStylesBundle = {
  /** Keys are camelCase stems (e.g. `designTokens`). */
  domains: Record<string, ParsedDomainValue>;
  meta: StylesMeta;
};

export type CssDomainInput = {
  /** File stem without `.css` (e.g. `tokens`, `design-tokens`). */
  stem: string;
  css: string;
  from?: string;
};

function emptyTree(): StylesNestedTree {
  return {};
}

function normalizeModeSelector(selector: string): 'light' | 'dark' | null {
  const s = selector.replace(/\s+/g, ' ').trim();
  if (s === '.light') return 'light';
  if (s === '.dark') return 'dark';
  return null;
}

function sortThemeModes(modes: string[]): string[] {
  const preferred = ['light', 'dark'];
  const out = preferred.filter((m) => modes.includes(m));
  for (const m of modes) if (!out.includes(m)) out.push(m);
  return out;
}

function parseThemeModesFromCss(css: string, from?: string): string[] {
  const root = postcss.parse(css, { from });
  const modes: string[] = [];
  root.walkRules((rule) => {
    const m = normalizeModeSelector(rule.selector);
    if (m) modes.push(m);
  });
  return sortThemeModes([...new Set(modes)]);
}

function parseColsFallback(tokensCss: string, from?: string): number {
  const root = postcss.parse(tokensCss, { from });
  let max = 0;
  root.walkRules((rule) => {
    const m = rule.selector.match(/grid-cols-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return max > 0 ? max : 12;
}

function collectMetaFromTokensCss(tokensCss: string, from?: string): ParsedMeta {
  const root = postcss.parse(tokensCss, { from });
  const meta: ParsedMeta = {};
  root.walkAtRules('theme', (atRule) => {
    atRule.walkDecls((decl) => {
      const m = parseMetaFromDecl(decl.prop, decl.value);
      if (m) Object.assign(meta, m);
    });
  });
  return meta;
}

function collectNestedFromThemeAtRules(root: postcss.Root, into: StylesNestedTree): void {
  root.walkAtRules('theme', (atRule) => {
    atRule.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) return;
      if (isMetaDeclaration(decl.prop)) return;
      mergeVarNested(into, decl.prop, decl.value);
    });
  });
}

function collectNestedFromRootRules(root: postcss.Root, into: StylesNestedTree): void {
  root.walkRules((rule) => {
    const sel = rule.selector.replace(/\s+/g, ' ').trim();
    if (sel !== ':root') return;
    rule.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) return;
      mergeVarNested(into, decl.prop, decl.value);
    });
  });
}

function collectNestedThemeModes(root: postcss.Root, into: StylesThemeNested): void {
  root.walkRules((rule) => {
    const mode = normalizeModeSelector(rule.selector);
    if (!mode) return;
    const bucket = into[mode];
    rule.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) return;
      mergeVarNested(bucket, decl.prop, decl.value);
    });
  });
}

export type ParseDomainKind = 'tokens' | 'palette' | 'theme';

export function parseStylesDomain(
  css: string,
  kind: ParseDomainKind,
  options: { from?: string } = {},
): StylesNestedTree | StylesThemeNested {
  const root = postcss.parse(css, { from: options.from });
  if (kind === 'theme') {
    const out: StylesThemeNested = { light: emptyTree(), dark: emptyTree() };
    collectNestedThemeModes(root, out);
    return out;
  }
  const out = emptyTree();
  collectNestedFromThemeAtRules(root, out);
  if (kind === 'palette') {
    collectNestedFromRootRules(root, out);
  }
  return out;
}

export type ParseStylesFilesInput = {
  tokensCss: string;
  paletteCss: string;
  themeCss: string;
  from?: { tokens?: string; palette?: string; theme?: string };
};

/**
 * Parses an ordered list of CSS domain files. Stems `tokens`, `palette`, `theme` use the
 * legacy rules (tokens: @theme only; palette: @theme + :root; theme: .light/.dark only).
 * Any other stem uses full `@theme` + `:root` + mode rules.
 */
export function parseStylesFromDomains(input: {
  domains: CssDomainInput[];
  /**
   * Stem of the file that provides `@theme` meta and grid cols fallback.
   * Default: `tokens`, else first domain in order.
   */
  metaSourceStem?: string;
}): ParsedStylesBundle {
  const domains: Record<string, ParsedDomainValue> = {};

  for (const d of input.domains) {
    const key = stemToCamelCase(d.stem);
    if (d.stem === 'tokens') {
      domains[key] = parseStylesDomain(d.css, 'tokens', { from: d.from }) as StylesNestedTree;
    } else if (d.stem === 'palette') {
      domains[key] = parseStylesDomain(d.css, 'palette', { from: d.from }) as StylesNestedTree;
    } else if (d.stem === 'theme') {
      domains[key] = parseStylesDomain(d.css, 'theme', { from: d.from }) as StylesThemeNested;
    } else {
      domains[key] = parseSingleDomainCss(d.css, d.from) as ParsedDomainValue;
    }
  }

  const metaSource =
    (input.metaSourceStem ? input.domains.find((x) => x.stem === input.metaSourceStem) : undefined) ??
    input.domains.find((x) => x.stem === 'tokens') ??
    input.domains[0];
  const combinedCss = input.domains.map((d) => d.css).join('\n');
  const metaFromCss = collectMetaFromTokensCss(metaSource.css, metaSource.from);
  const themeModes = parseThemeModesFromCss(combinedCss, metaSource.from);
  const modes = themeModes.length > 0 ? themeModes : (['light', 'dark'] as const as unknown as string[]);

  const defaultThemeRaw = metaFromCss.defaultTheme ?? 'light';
  const defaultTheme = modes.includes(defaultThemeRaw) ? defaultThemeRaw : modes[0];

  const cols = metaFromCss.cols ?? parseColsFallback(metaSource.css, metaSource.from);

  const meta: StylesMeta = {
    defaultTheme,
    cols,
    themeModes: modes as readonly string[],
  };

  return { domains, meta };
}

export function parseStylesFromFiles(input: ParseStylesFilesInput): ParsedStylesDomains {
  const bundle = parseStylesFromDomains({
    domains: [
      { stem: 'tokens', css: input.tokensCss, from: input.from?.tokens },
      { stem: 'palette', css: input.paletteCss, from: input.from?.palette },
      { stem: 'theme', css: input.themeCss, from: input.from?.theme },
    ],
  });
  return {
    tokens: bundle.domains.tokens as StylesNestedTree,
    palette: bundle.domains.palette as StylesNestedTree,
    theme: bundle.domains.theme as StylesThemeNested,
    meta: bundle.meta,
  };
}
