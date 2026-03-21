import { describe, it, expect } from 'vitest';
import { stemToCamelCase } from '../src/css/stemUtils.js';

describe('stemToCamelCase', () => {
  it('passes through stems without hyphens', () => {
    expect(stemToCamelCase('tokens')).toBe('tokens');
  });

  it('converts kebab-case to camelCase', () => {
    expect(stemToCamelCase('design-tokens')).toBe('designTokens');
  });
});
