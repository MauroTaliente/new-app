import type { CssVarMap, VarMapsByStem } from './collectVarMaps.js';
import type { StylesNestedTree } from './nestedCssVars.js';
import type {
  ParsedStylesBundle,
  ParsedDomainValue,
  StylesThemeNested,
  ParsedStylesDomains,
} from './parseStylesFromCss.js';
import type { ResolvedVarMaps } from './collectVarMaps.js';
import { stemToCamelCase } from './stemUtils.js';

const MAX_DEPTH = 64;
const INTEGER_RE = /^[-+]?\d+$/;

/** Entire value is a single `var()` (optional fallback). */
export function parseSimpleVar(value: string): { name: string; fallback?: string } | null {
  const v = value.trim();
  const m1 = v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (m1) return { name: m1[1] };
  const m2 = v.match(/^var\(\s*(--[\w-]+)\s*,\s*(.+)\)$/s);
  if (m2) return { name: m2[1], fallback: m2[2].trim() };
  return null;
}

const VAR_CALL_RE = /var\(\s*(--[\w-]+)\s*\)/g;

function maybeCoerceNumberString(v: string): string | number {
  const t = v.trim();
  if (INTEGER_RE.test(t)) return Number(t);
  return v;
}

function maybeCoerceStringOrNumber(v: string | number): string | number {
  if (typeof v === 'number') return v;
  return maybeCoerceNumberString(v);
}

function resolveValueRaw(
  value: string,
  chain: CssVarMap[],
  depth: number,
  path: string[],
): string | number {
  if (depth > MAX_DEPTH) return maybeCoerceNumberString(value);

  const v = value.trim();
  const simple = parseSimpleVar(v);
  if (simple) {
    const key = simple.name.startsWith('--') ? simple.name : `--${simple.name}`;
    if (path.includes(key)) {
      if (simple.fallback !== undefined) {
        return resolveValueRaw(simple.fallback, chain, depth + 1, path);
      }
      return maybeCoerceNumberString(v);
    }

    let raw: string | undefined;
    for (const m of chain) {
      const got = m.get(key);
      if (got !== undefined) {
        raw = got;
        break;
      }
    }
    if (raw !== undefined) {
      return resolveValueRaw(raw, chain, depth + 1, [...path, key]);
    }
    if (simple.fallback !== undefined) {
      return resolveValueRaw(simple.fallback, chain, depth + 1, path);
    }
    return maybeCoerceNumberString(v);
  }

  if (VAR_CALL_RE.test(v)) {
    VAR_CALL_RE.lastIndex = 0;
    const replaced = v.replace(VAR_CALL_RE, (full, name: string) => {
      const key = name.startsWith('--') ? name : `--${name}`;
      if (path.includes(key)) return full;
      let inner: string | undefined;
      for (const m of chain) {
        const got = m.get(key);
        if (got !== undefined) {
          inner = got;
          break;
        }
      }
      if (inner === undefined) return full;
      const resolved = resolveValueRaw(inner, chain, depth + 1, [...path, key]);
      return typeof resolved === 'number' ? String(resolved) : resolved;
    });
    if (replaced !== v) {
      return resolveValueRaw(replaced, chain, depth + 1, path);
    }
  }

  return maybeCoerceNumberString(v);
}

function resolveLeaf(value: string, chain: CssVarMap[]): string | number {
  const out = resolveValueRaw(value, chain, 0, []);
  return typeof out === 'number' ? out : maybeCoerceStringOrNumber(out);
}

function mapTree(tree: StylesNestedTree, fn: (s: string) => string | number): StylesNestedTree {
  const out: StylesNestedTree = {};
  for (const key of Object.keys(tree).sort()) {
    const v = tree[key];
    if (typeof v === 'string') {
      out[key] = fn(v);
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[key] = mapTree(v as StylesNestedTree, fn);
    } else {
      out[key] = v as unknown as string;
    }
  }
  return out;
}

function baseChainForIndex(i: number, maps: VarMapsByStem, orderedStems: string[]): CssVarMap[] {
  return orderedStems.slice(i).map((s) => maps[s].base);
}

function modeChainForStem(
  stem: string,
  mode: 'light' | 'dark',
  maps: VarMapsByStem,
  orderedStems: string[],
): CssVarMap[] {
  const otherBases = orderedStems.filter((s) => s !== stem).map((s) => maps[s].base);
  const modeMap = mode === 'light' ? maps[stem].light : maps[stem].dark;
  return [modeMap, ...otherBases];
}

function isThemeModesOnly(v: ParsedDomainValue): v is StylesThemeNested {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const keys = Object.keys(v as object);
  return keys.length === 2 && keys.includes('light') && keys.includes('dark');
}

function isHybridWithModes(v: ParsedDomainValue): v is StylesNestedTree & {
  light: StylesNestedTree;
  dark: StylesNestedTree;
} {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const keys = Object.keys(v as object);
  return keys.includes('light') && keys.includes('dark') && keys.length > 2;
}

function resolveThemeNested(
  t: StylesThemeNested,
  lightChain: CssVarMap[],
  darkChain: CssVarMap[],
): StylesThemeNested {
  return {
    light: mapTree(t.light, (s) => resolveLeaf(s, lightChain)),
    dark: mapTree(t.dark, (s) => resolveLeaf(s, darkChain)),
  };
}

function resolveHybridTree(
  t: StylesNestedTree & { light: StylesNestedTree; dark: StylesNestedTree },
  stem: string,
  maps: VarMapsByStem,
  orderedStems: string[],
  stemIndex: number,
): ParsedDomainValue {
  const baseChain = baseChainForIndex(stemIndex, maps, orderedStems);
  const lightChain = modeChainForStem(stem, 'light', maps, orderedStems);
  const darkChain = modeChainForStem(stem, 'dark', maps, orderedStems);

  const out: Record<string, unknown> = {};
  for (const key of Object.keys(t).sort()) {
    const v = (t as Record<string, unknown>)[key];
    if (key === 'light' && v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[key] = mapTree(v as StylesNestedTree, (s) => resolveLeaf(s, lightChain));
    } else if (key === 'dark' && v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[key] = mapTree(v as StylesNestedTree, (s) => resolveLeaf(s, darkChain));
    } else if (typeof v === 'string') {
      out[key] = resolveLeaf(v, baseChain);
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[key] = mapTree(v as StylesNestedTree, (s) => resolveLeaf(s, baseChain));
    } else {
      out[key] = v;
    }
  }
  return out as ParsedDomainValue;
}

function resolveDomainTree(
  stem: string,
  tree: ParsedDomainValue,
  maps: VarMapsByStem,
  orderedStems: string[],
): ParsedDomainValue {
  const stemIndex = orderedStems.indexOf(stem);
  if (stemIndex < 0) throw new Error(`[resolveCssVarValues] Unknown stem "${stem}"`);

  if (isThemeModesOnly(tree)) {
    const lightChain = modeChainForStem(stem, 'light', maps, orderedStems);
    const darkChain = modeChainForStem(stem, 'dark', maps, orderedStems);
    return resolveThemeNested(tree, lightChain, darkChain);
  }

  if (isHybridWithModes(tree)) {
    return resolveHybridTree(tree, stem, maps, orderedStems, stemIndex);
  }

  const baseChain = baseChainForIndex(stemIndex, maps, orderedStems);
  return mapTree(tree as StylesNestedTree, (s) => resolveLeaf(s, baseChain));
}

function applyResolvedVarValuesBundle(
  parsed: ParsedStylesBundle,
  maps: VarMapsByStem,
  orderedStems: string[],
): ParsedStylesBundle {
  const out: Record<string, ParsedDomainValue> = { ...parsed.domains };
  for (const stem of orderedStems) {
    const camel = stemToCamelCase(stem);
    const tree = out[camel];
    if (tree === undefined) continue;
    out[camel] = resolveDomainTree(stem, tree, maps, orderedStems);
  }
  return { domains: out, meta: parsed.meta };
}

function isParsedStylesBundle(
  parsed: ParsedStylesBundle | ParsedStylesDomains,
): parsed is ParsedStylesBundle {
  return typeof parsed === 'object' && parsed !== null && 'domains' in parsed;
}

/** Legacy 3-file shape: tokens → palette → theme order. */
function applyResolvedVarValuesDomains(
  parsed: ParsedStylesDomains,
  maps: ResolvedVarMaps,
): ParsedStylesDomains {
  const bundle: ParsedStylesBundle = {
    domains: {
      tokens: parsed.tokens,
      palette: parsed.palette,
      theme: parsed.theme,
    },
    meta: parsed.meta,
  };
  const varMaps: VarMapsByStem = {
    tokens: { base: maps.tokens, light: new Map(), dark: new Map() },
    palette: { base: maps.palette, light: new Map(), dark: new Map() },
    theme: { base: new Map(), light: maps.light, dark: maps.dark },
  };
  const resolved = applyResolvedVarValuesBundle(bundle, varMaps, ['tokens', 'palette', 'theme']);
  return {
    tokens: resolved.domains.tokens as StylesNestedTree,
    palette: resolved.domains.palette as StylesNestedTree,
    theme: resolved.domains.theme as StylesThemeNested,
    meta: resolved.meta,
  };
}

/**
 * Resolves `var(--*)` in every domain using per-stem maps and cascade order.
 */
export function applyResolvedVarValues(
  parsed: ParsedStylesBundle,
  maps: VarMapsByStem,
  orderedStems: string[],
): ParsedStylesBundle;
export function applyResolvedVarValues(
  parsed: ParsedStylesDomains,
  maps: ResolvedVarMaps,
): ParsedStylesDomains;
export function applyResolvedVarValues(
  parsed: ParsedStylesBundle | ParsedStylesDomains,
  maps: VarMapsByStem | ResolvedVarMaps,
  orderedStems?: string[],
): ParsedStylesBundle | ParsedStylesDomains {
  if (isParsedStylesBundle(parsed)) {
    if (!orderedStems?.length) {
      throw new Error('[applyResolvedVarValues] orderedStems is required for ParsedStylesBundle');
    }
    return applyResolvedVarValuesBundle(parsed, maps as VarMapsByStem, orderedStems);
  }
  return applyResolvedVarValuesDomains(parsed, maps as ResolvedVarMaps);
}
