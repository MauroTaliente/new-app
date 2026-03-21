import postcss from 'postcss';
import { isMetaDeclaration } from './nestedCssVars.js';

/** Flat map: CSS custom property name → raw value string. */
export type CssVarMap = Map<string, string>;

export type DomainVarMaps = {
  base: CssVarMap;
  light: CssVarMap;
  dark: CssVarMap;
};

function mergeMapInto(target: CssVarMap, source: CssVarMap): void {
  for (const [k, v] of source) target.set(k, v);
}

/**
 * `@theme` + `:root` in one map (document order; later wins).
 */
function collectBaseFromCss(css: string, from?: string): CssVarMap {
  const map: CssVarMap = new Map();
  const root = postcss.parse(css, { from });
  root.walkAtRules('theme', (atRule) => {
    atRule.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) return;
      if (isMetaDeclaration(decl.prop)) return;
      map.set(decl.prop, decl.value.trim());
    });
  });
  root.walkRules((rule) => {
    if (rule.selector.replace(/\s+/g, ' ').trim() !== ':root') return;
    rule.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) return;
      map.set(decl.prop, decl.value.trim());
    });
  });
  return map;
}

function normalizeModeSelector(selector: string): 'light' | 'dark' | null {
  const s = selector.replace(/\s+/g, ' ').trim();
  if (s === '.light') return 'light';
  if (s === '.dark') return 'dark';
  return null;
}

function collectModeFromCss(css: string, mode: 'light' | 'dark', from?: string): CssVarMap {
  const map: CssVarMap = new Map();
  const root = postcss.parse(css, { from });
  root.walkRules((rule) => {
    if (normalizeModeSelector(rule.selector) !== mode) return;
    rule.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) return;
      map.set(decl.prop, decl.value.trim());
    });
  });
  return map;
}

export function collectVarMapsForDomainCss(css: string, from?: string): DomainVarMaps {
  return {
    base: collectBaseFromCss(css, from),
    light: collectModeFromCss(css, 'light', from),
    dark: collectModeFromCss(css, 'dark', from),
  };
}

/** @deprecated use collectVarMapsForDomainCss */
export function collectVarMapFromTokensCss(tokensCss: string, from?: string): CssVarMap {
  return collectBaseFromCss(tokensCss, from);
}

export function collectVarMapFromPaletteCss(paletteCss: string, from?: string): CssVarMap {
  return collectBaseFromCss(paletteCss, from);
}

export function collectVarMapFromThemeMode(themeCss: string, mode: 'light' | 'dark', from?: string): CssVarMap {
  return collectModeFromCss(themeCss, mode, from);
}

export type VarMapsByStem = Record<string, DomainVarMaps>;

export type CollectAllVarMapsInput = {
  domains: CssDomainFileInput[];
};

export type CssDomainFileInput = {
  stem: string;
  css: string;
  from?: string;
};

export function collectAllVarMaps(input: CollectAllVarMapsInput): VarMapsByStem {
  const out: VarMapsByStem = {};
  for (const d of input.domains) {
    out[d.stem] = collectVarMapsForDomainCss(d.css, d.from);
  }
  return out;
}

/** Legacy 3-file shape for resolver */
export type ResolvedVarMaps = {
  palette: CssVarMap;
  tokens: CssVarMap;
  light: CssVarMap;
  dark: CssVarMap;
};

export function collectLegacyVarMaps(input: {
  tokensCss: string;
  paletteCss: string;
  themeCss: string;
  from?: { tokens?: string; palette?: string; theme?: string };
}): ResolvedVarMaps {
  return {
    palette: collectBaseFromCss(input.paletteCss, input.from?.palette),
    tokens: collectBaseFromCss(input.tokensCss, input.from?.tokens),
    light: collectModeFromCss(input.themeCss, 'light', input.from?.theme),
    dark: collectModeFromCss(input.themeCss, 'dark', input.from?.theme),
  };
}
