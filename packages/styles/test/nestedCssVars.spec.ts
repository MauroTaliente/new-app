import { describe, it, expect } from 'vitest';
import {
  isMetaDeclaration,
  mergeVarNested,
  parseMetaFromDecl,
} from '../src/css/nestedCssVars.js';

describe('nestedCssVars', () => {
  it('parses theme meta declarations', () => {
    expect(parseMetaFromDecl('--theme-default', '"dark"')).toEqual({ defaultTheme: 'dark' });
    expect(parseMetaFromDecl('--theme-cols', '12')).toEqual({ cols: 12 });
    expect(parseMetaFromDecl('--color-bg', '#fff')).toBeNull();
  });

  it('detects meta variable names', () => {
    expect(isMetaDeclaration('--theme-default')).toBe(true);
    expect(isMetaDeclaration('--color-bg')).toBe(false);
  });

  it('merges scoped variables into a nested tree', () => {
    const root: Record<string, unknown> = {};
    mergeVarNested(root, '--color-bg-100', '#111');
    expect(root).toEqual({ color: { 'bg-100': '#111' } });
  });
});
