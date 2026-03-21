import type { ParsedStylesBundle, ParsedDomainValue, StylesThemeNested } from './parseStylesFromCss.js';

function serializeNested(obj: unknown, indentLevel: number): string {
  if (typeof obj === 'number') {
    return String(obj);
  }
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    const keys = Object.keys(o).sort();
    if (keys.length === 0) return '{}';
    const pad = '  '.repeat(indentLevel);
    const innerPad = '  '.repeat(indentLevel + 1);
    const lines = keys.map(
      (k) => `${innerPad}${JSON.stringify(k)}: ${serializeNested(o[k], indentLevel + 1)},`,
    );
    return `{\n${lines.join('\n')}\n${pad}}`;
  }
  return JSON.stringify(obj);
}

function serializeThemeModesTuple(modes: readonly string[]): string {
  if (modes.length === 0) return `[] as const`;
  const inner = modes.map((m) => JSON.stringify(m)).join(', ');
  return `[${inner}] as const`;
}

function isThemeModesOnly(v: ParsedDomainValue): v is StylesThemeNested {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const keys = Object.keys(v as object);
  return keys.length === 2 && keys.includes('light') && keys.includes('dark');
}

function findThemeDomainKey(domains: Record<string, ParsedDomainValue>): string | null {
  for (const [k, v] of Object.entries(domains)) {
    if (isThemeModesOnly(v)) return k;
  }
  return null;
}

/**
 * Emits a TS module with `styles as const` and derived types.
 */
export function emitStylesGeneratedModule(
  data: ParsedStylesBundle,
  options: { banner?: string; /** camelCase keys, emit order for domain blocks */ domainOrder?: string[] } = {},
): string {
  const banner = options.banner ?? '// Auto-generated from CSS. Do not edit directly.';
  const modesTuple = serializeThemeModesTuple(data.meta.themeModes);
  const metaManual = `{\n    ${JSON.stringify('defaultTheme')}: ${JSON.stringify(data.meta.defaultTheme)},\n    ${JSON.stringify('cols')}: ${data.meta.cols},\n    ${JSON.stringify('themeModes')}: ${modesTuple},\n  }`;

  const domainKeys =
    options.domainOrder?.filter((k) => k in data.domains) ??
    Object.keys(data.domains).sort();

  const domainLines = domainKeys.map((key) => {
    const serialized = serializeNested(data.domains[key], 1);
    return `  ${JSON.stringify(key)}: ${serialized},`;
  });

  const themeKey = findThemeDomainKey(data.domains);
  const themeModeExport = themeKey
    ? `\nexport type ThemeMode = keyof typeof styles.${themeKey};\n`
    : '';

  return `${banner}

export const styles = {
  meta: ${metaManual},
${domainLines.join('\n')}
} as const;
${themeModeExport}
export type Styles = typeof styles;
export type ThemeName = (typeof styles.meta.themeModes)[number];
`;
}
