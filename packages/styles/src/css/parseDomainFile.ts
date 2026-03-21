import postcss from 'postcss';
import {
  type StylesNestedTree,
  mergeVarNested,
  isMetaDeclaration,
} from './nestedCssVars.js';
type ThemeModes = { light: StylesNestedTree; dark: StylesNestedTree };

function emptyTree(): StylesNestedTree {
  return {};
}

function normalizeModeSelector(selector: string): 'light' | 'dark' | null {
  const s = selector.replace(/\s+/g, ' ').trim();
  if (s === '.light') return 'light';
  if (s === '.dark') return 'dark';
  return null;
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

function collectNestedThemeModes(root: postcss.Root, into: ThemeModes): void {
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

function hasTopLevelKeys(t: StylesNestedTree): boolean {
  return Object.keys(t).length > 0;
}

/**
 * One CSS file → base (@theme + :root) + optional .light / .dark trees.
 */
export function parseSingleDomainCss(
  css: string,
  from?: string,
): StylesNestedTree | ThemeModes {
  const root = postcss.parse(css, { from });
  const base = emptyTree();
  const light = emptyTree();
  const dark = emptyTree();
  collectNestedFromThemeAtRules(root, base);
  collectNestedFromRootRules(root, base);
  const modes: ThemeModes = { light, dark };
  collectNestedThemeModes(root, modes);

  const hasL = hasTopLevelKeys(light);
  const hasD = hasTopLevelKeys(dark);
  const hasB = hasTopLevelKeys(base);

  if (hasL || hasD) {
    if (!hasB) {
      return { light, dark };
    }
    return { ...base, light, dark } as StylesNestedTree;
  }
  return base;
}
