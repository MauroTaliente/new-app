import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

  it('cae al árbol propio cuando el cwd no tiene la dependencia', () => {
    // A cwd with no node_modules → consumer resolution fails, fallback resolves.
    const emptyCwd = mkdtempSync(join(tmpdir(), 'rg-resolve-'));
    const styles = resolvePackageBin(
      '@react33/react-styles',
      'generate-tokens.js',
      emptyCwd,
    );
    expect(existsSync(styles)).toBe(true);
  });
});
