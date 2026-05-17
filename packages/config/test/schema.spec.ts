import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createReact33ConfigValidator, validateReact33Config } from '../src/validate-react33-config.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(testDir, '..');
const dataDir = resolve(pkgRoot, 'data');

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

describe('validateReact33Config', () => {
  const validate = createReact33ConfigValidator();

  it('valida el ejemplo minimal', () => {
    const result = validateReact33Config(
      readJson(resolve(dataDir, 'examples/react33.config.minimal.json')),
      validate,
    );
    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
  });

  it('valida el ejemplo full', () => {
    const result = validateReact33Config(
      readJson(resolve(dataDir, 'examples/react33.config.full.json')),
      validate,
    );
    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
  });

  it('valida apps/demo/react33.config.json', () => {
    const result = validateReact33Config(
      readJson(resolve(pkgRoot, '../../apps/demo/react33.config.json')),
      validate,
    );
    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
  });

  it('rechaza openApi.files sin outputs requeridos', () => {
    const result = validateReact33Config(
      readJson(resolve(dataDir, 'examples/react33.config.invalid.json')),
      validate,
    );
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.instancePath.includes('openApi'))).toBe(true);
  });

  it('el fixture OpenAPI demo existe para networking', () => {
    const yaml = resolve(dataDir, 'fixtures/openapi-3.1-demo.yaml');
    expect(readFileSync(yaml, 'utf8')).toContain('openapi: 3.1.0');
  });
});

describe('react33-i18n.config.schema.json', () => {
  it('referencia react33I18n del schema raíz', () => {
    const partial = readJson(resolve(pkgRoot, 'react33-i18n.config.schema.json'));
    expect(partial).toMatchObject({
      $ref: 'react33.config.schema.json#/$defs/react33I18n',
    });
  });
});
