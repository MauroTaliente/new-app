import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectScopes,
  emitI18nGeneratedSource,
  emitI18nRuntimeGeneratedSource,
  flattenLocaleStructure,
  writeI18nFromConfig,
} from '../src/generate-locales.js';
import { readReact33I18nConfig } from '../src/read-react33-i18n-config.js';

describe('readReact33I18nConfig', () => {
  it('returns null when section is missing', () => {
    expect(readReact33I18nConfig({})).toBeNull();
  });

  it('parses a valid react33I18n block', () => {
    expect(
      readReact33I18nConfig({
        react33I18n: {
          defaultLocale: 'es',
          locales: ['es', 'en'],
          localesDirectory: './locales',
          cookieName: 'locale',
        },
      }),
    ).toEqual({
      defaultLocale: 'es',
      locales: ['es', 'en'],
      localesDirectory: './locales',
      cookieName: 'locale',
    });
  });
});

describe('collectScopes / flattenLocaleStructure', () => {
  it('detects flat string scopes', () => {
    const structure = {
      login: { email: 'x' },
      nested: { inner: { nope: 1 } },
    };
    expect(collectScopes(structure)).toEqual(['login']);
    expect(flattenLocaleStructure(structure)).toEqual({ login: { email: 'x' } });
  });
});

describe('emitI18nGeneratedSource', () => {
  it('emits locale constants and scoped message key types', () => {
    const source = emitI18nGeneratedSource(
      {
        defaultLocale: 'es',
        locales: ['es', 'en'],
        localesDirectory: './locales',
        cookieName: 'locale',
        persistenceMode: 'cookie',
      },
      { login: { brand: 'trivo', signIn: 'Iniciar' } },
    );
    expect(source).toContain('ALLOWED_LOCALES = ["es","en"]');
    expect(source).toContain('LoginMessageKey = "brand" | "signIn"');
    expect(source).toContain('export type Structure = { login: LoginCopy }');
    expect(source).toContain('"cookieName": "locale"');
    expect(source).not.toContain('export const I18N_PERSISTENCE_MODE');
  });
});

describe('emitI18nRuntimeGeneratedSource', () => {
  it('emits persistenceEnvKey when configured', () => {
    const source = emitI18nRuntimeGeneratedSource(
      {
        defaultLocale: 'es',
        locales: ['es'],
        localesDirectory: './locales',
        persistenceEnvKey: 'NEXT_PUBLIC_LOCALE_PERSISTENCE',
        runtimeMode: 'spa',
      },
      {
        typesImportPath: './i18n.generated',
        localeImports: [{ code: 'es', importPath: '../../locales/es' }],
      },
    );
    expect(source).toContain('persistenceEnvKey: "NEXT_PUBLIC_LOCALE_PERSISTENCE"');
  });

  it('emits dictionaries, provider, and persistence helpers', () => {
    const source = emitI18nRuntimeGeneratedSource(
      {
        defaultLocale: 'es',
        locales: ['es', 'en'],
        localesDirectory: './locales',
        cookieName: 'locale',
        persistenceMode: 'cookie',
        runtimeMode: 'spa',
      },
      {
        typesImportPath: './i18n.generated',
        localeImports: [
          { code: 'es', importPath: '../../locales/es' },
          { code: 'en', importPath: '../../locales/en' },
        ],
      },
    );
    expect(source).toContain('createLocaleRuntime');
    expect(source).toContain('createLocalePersistence');
    expect(source).toContain('export const dictionaries');
    expect(source).toContain('LocaleProvider');
    expect(source).toContain('getInitialLocale');
    expect(source).toContain('persistLocale');
    expect(source).not.toContain('resolveAppLocale');
    expect(source).not.toContain('persistLocaleChoice');
    expect(source).toContain('persistenceEnvKey: "REACT33_I18N_PERSISTENCE"');
  });

  it('omits persistenceEnvKey when config sets empty string', () => {
    const source = emitI18nRuntimeGeneratedSource(
      {
        defaultLocale: 'es',
        locales: ['es'],
        localesDirectory: './locales',
        persistenceEnvKey: '',
        runtimeMode: 'spa',
      },
      {
        typesImportPath: './i18n.generated',
        localeImports: [{ code: 'es', importPath: '../../locales/es' }],
      },
    );
    expect(source).not.toContain('persistenceEnvKey:');
  });
});

describe('writeI18nFromConfig', () => {
  it('writes i18n.generated.ts from config and locale module', async () => {
    const root = mkdtempSync(join(tmpdir(), 'react-i18n-gen-'));
    mkdirSync(join(root, 'locales'), { recursive: true });
    writeFileSync(
      join(root, 'react33.config.json'),
      JSON.stringify({
        react33I18n: {
          defaultLocale: 'es',
          locales: ['es'],
          localesDirectory: './locales',
          generatedTypesOutput: './out/i18n.generated.ts',
          generatedRuntimeOutput: './out/i18n.runtime.generated.tsx',
        },
      }),
    );
    writeFileSync(
      join(root, 'locales', 'es.ts'),
      `export const es = { login: { hello: 'Hola' } }`,
    );

    const result = await writeI18nFromConfig({
      configPath: 'react33.config.json',
      cwd: root,
      loadLocale: async () => ({ login: { hello: 'Hola' } }),
    });

    expect(result.skipped).toBe(false);
    const out = readFileSync(join(root, 'out', 'i18n.generated.ts'), 'utf8');
    expect(out).toContain('LoginMessageKey = "hello"');
    expect(out).toContain('DEFAULT_LOCALE = "es"');

    const runtime = readFileSync(join(root, 'out', 'i18n.runtime.generated.tsx'), 'utf8');
    expect(runtime).toContain('createLocaleRuntime');
    expect(runtime).toContain('dictionaries');
  });

  it('skips when react33I18n is absent', async () => {
    const root = mkdtempSync(join(tmpdir(), 'react-i18n-gen-'));
    writeFileSync(join(root, 'react33.config.json'), '{}');
    const result = await writeI18nFromConfig({
      configPath: 'react33.config.json',
      cwd: root,
    });
    expect(result.skipped).toBe(true);
  });
});
