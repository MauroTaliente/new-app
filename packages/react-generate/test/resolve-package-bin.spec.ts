import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolvePackageBin } from '../src/resolve-package-bin.js';

describe('resolvePackageBin', () => {
  it('resuelve bins publicados de styles y networking', () => {
    const styles = resolvePackageBin('@react33/react-styles', 'generate-tokens.js');
    const networking = resolvePackageBin('@react33/react-networking', 'generate-apis.js');

    expect(existsSync(styles)).toBe(true);
    expect(existsSync(networking)).toBe(true);
    expect(styles).toContain('generate-tokens.js');
    expect(networking).toContain('generate-apis.js');
  });
});
