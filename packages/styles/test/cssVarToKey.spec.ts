import { describe, it, expect } from 'vitest';
import { cssVarToKey } from '../src/css/cssVarToKey.js';

describe('cssVarToKey', () => {
  it('converts dashed CSS vars to camelCase keys', () => {
    expect(cssVarToKey('--color-bg-100')).toBe('colorBg100');
    expect(cssVarToKey('spacing-md')).toBe('spacingMd');
  });

  it('returns raw body when no segments remain', () => {
    expect(cssVarToKey('--')).toBe('');
  });
});
