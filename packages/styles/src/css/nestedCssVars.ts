/**
 * Nesting rule: `--{scope}-{rest}` → `root[scope][rest]` where `rest` keeps inner hyphens
 * (e.g. `--color-bg-100` → color.bg-100, `--easing-in-out` → easing.in-out).
 * Single-segment `--foo` → `other.foo`.
 * Generator meta vars are excluded from the tree.
 */

export type StylesNestedTree = Record<string, unknown>;

const META_FULL_NAMES = new Set(['theme-default', 'theme-cols']);

export type ParsedMeta = {
  defaultTheme?: string;
  cols?: number;
};

export function parseMetaFromDecl(prop: string, value: string): Partial<ParsedMeta> | null {
  if (!prop.startsWith('--')) return null;
  const body = prop.slice(2);
  if (body === 'theme-default') {
    const v = value.trim().replace(/^['"]|['"]$/g, '');
    if (v === 'light' || v === 'dark') return { defaultTheme: v };
    return { defaultTheme: 'light' };
  }
  if (body === 'theme-cols') {
    const n = parseInt(value.trim(), 10);
    if (!Number.isNaN(n) && n > 0) return { cols: n };
  }
  return null;
}

export function isMetaDeclaration(prop: string): boolean {
  if (!prop.startsWith('--')) return false;
  return META_FULL_NAMES.has(prop.slice(2));
}

/**
 * Merge a CSS variable into a tree: first `-` segment = scope, remainder = key (hyphens preserved).
 */
export function mergeVarNested(root: StylesNestedTree, prop: string, value: string): void {
  if (!prop.startsWith('--')) return;
  const body = prop.slice(2);
  if (META_FULL_NAMES.has(body)) return;

  const parts = body.split('-').filter(Boolean);
  if (parts.length === 0) return;

  const trimmed = value.trim();

  if (parts.length === 1) {
    if (!root.other) root.other = {};
    (root.other as Record<string, string>)[parts[0]] = trimmed;
    return;
  }

  const scope = parts[0];
  const key = parts.slice(1).join('-');
  if (!root[scope]) root[scope] = {};
  const bucket = root[scope] as Record<string, string>;
  bucket[key] = trimmed;
}
