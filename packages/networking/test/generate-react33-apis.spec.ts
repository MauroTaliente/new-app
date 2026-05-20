import { describe, it, expect } from 'vitest';
import {
  deriveHooksGeneratedPath,
  generateApisHooksModuleSource,
  generateApisModuleSource,
  readReact33NetworkingOutputPaths,
} from '../src/generate-react33-apis.js';

describe('generateApisModuleSource', () => {
  it('emits createApiRegistry from apis object keys', () => {
    const src = generateApisModuleSource({
      react33Networking: {
        apis: {
          pokemon: {
            url: 'https://pokeapi.co/api/v2',
            headers: { Accept: 'application/json' },
          },
        },
      },
    });
    expect(src).toContain('pokemon:');
    expect(src).toContain('https://pokeapi.co/api/v2');
    expect(src).toContain('export const apis = createApiRegistry');
    expect(src).toContain('export const pokemonRequest = apis.pokemon');
    expect(src).toContain('export type ApiNames = keyof typeof apis');
    expect(src).toContain('export const definitions');
    expect(src).toContain('satisfies Record<string, ApiClientConfigBody>');
  });

  it('rejects apis array legacy shape', () => {
    expect(() =>
      generateApisModuleSource({
        react33Networking: {
          apis: [{ name: 'x', url: 'https://x.test' }],
        },
      }),
    ).toThrow(/must be an object/);
  });

  it('allows empty apis object', () => {
    const src = generateApisModuleSource({
      react33Networking: { apis: {} },
    });
    expect(src).toMatch(
      /export const definitions = \{\} satisfies Record<string, ApiClientConfigBody>/s,
    );
    expect(src).toContain('export type ApiNames = keyof typeof apis');
  });
});

describe('readReact33NetworkingOutputPaths', () => {
  it('returns output and hooksOutput when present', () => {
    expect(
      readReact33NetworkingOutputPaths({
        react33Networking: { output: './a/apis.generated.ts', hooksOutput: './b/hooks.tsx', apis: {} },
      }),
    ).toEqual({ output: './a/apis.generated.ts', hooksOutput: './b/hooks.tsx' });
  });

  it('returns empty object when react33Networking is missing', () => {
    expect(readReact33NetworkingOutputPaths({})).toEqual({});
  });

  it('returns undefined strings when output is not a string', () => {
    expect(
      readReact33NetworkingOutputPaths({
        react33Networking: { output: 1 as unknown as string, apis: {} },
      }),
    ).toEqual({ output: undefined, hooksOutput: undefined });
  });
});

describe('deriveHooksGeneratedPath', () => {
  it('maps apis.generated.ts to apis.client.generated.tsx', () => {
    expect(deriveHooksGeneratedPath('/app/src/api/apis.generated.ts')).toBe(
      '/app/src/api/apis.client.generated.tsx',
    );
  });
});

describe('generateApisModuleSource — runtimeModule', () => {
  it('routes load through apiRuntime.load and forwards defaults', () => {
    const src = generateApisModuleSource({
      react33Networking: {
        runtimeModule: './api.runtime',
        apis: {
          pokemon: { url: 'https://pokeapi.co/api/v2' },
        },
      },
    });
    expect(src).toContain("import { apiRuntime } from \"./api.runtime\"");
    expect(src).toContain('apiRuntime.defineDefinitions(baseDefinitions)');
    expect(src).toContain('load: apiRuntime.load');
    expect(src).toContain('defaults: apiRuntime.defaults');
  });
});

describe('generateApisHooksModuleSource', () => {
  it('emits useAsyncFetch wrappers per API', () => {
    const src = generateApisHooksModuleSource({
      react33Networking: {
        apis: {
          pokemon: { url: 'https://pokeapi.co/api/v2' },
        },
      },
    });
    expect(src).toContain("'use client'");
    expect(src).toContain('usePokemonRequest');
    expect(src).toContain('apis.pokemon');
    expect(src).toContain('useAsyncFetch');
    expect(src).toContain('RequestReturn');
    expect(src).toContain('settingsAction');
    expect(src).toContain('settingsAction ??');
  });

  it('emits empty hooks module when apis is missing', () => {
    const src = generateApisHooksModuleSource({});
    expect(src).toContain("'use client'");
    expect(src).toContain('export {}');
  });
});
