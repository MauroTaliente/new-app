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
  it('returns registryOutput and hooksOutput when present', () => {
    expect(
      readReact33NetworkingOutputPaths({
        react33Networking: {
          registryOutput: './a/apis.generated.ts',
          hooksOutput: './b/hooks.tsx',
          apis: {},
        },
      }),
    ).toEqual({ registryOutput: './a/apis.generated.ts', hooksOutput: './b/hooks.tsx' });
  });

  it('returns empty object when react33Networking is missing', () => {
    expect(readReact33NetworkingOutputPaths({})).toEqual({});
  });

  it('returns undefined strings when registryOutput is not a string', () => {
    expect(
      readReact33NetworkingOutputPaths({
        react33Networking: { registryOutput: 1 as unknown as string, apis: {} },
      }),
    ).toEqual({ registryOutput: undefined, hooksOutput: undefined });
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
  it('routes auth through apiRuntime and forwards per-API loads + defaults', () => {
    const src = generateApisModuleSource({
      react33Networking: {
        runtimeModule: './session.runtime.generated',
        apis: {
          pokemon: { url: 'https://pokeapi.co/api/v2', session: 'main' },
        },
      },
    });
    expect(src).toContain('import { apiRuntime } from "./session.runtime.generated"');
    // defineDefinitions is optional — codegen falls back to baseDefinitions when absent.
    expect(src).toContain('apiRuntime.defineDefinitions?.(baseDefinitions) ?? baseDefinitions');
    expect(src).toContain('load: apiRuntime.load');
    expect(src).toContain('loads: apiRuntime.loads');
    expect(src).toContain('defaults: apiRuntime.defaults');
    expect(src).toContain('defaultsByApi: apiRuntime.defaultsByApi');
  });

  it('emits the API definition unaffected by the session foreign key', () => {
    const src = generateApisModuleSource({
      react33Networking: {
        runtimeModule: './session.runtime.generated',
        apis: { pokemon: { url: 'https://pokeapi.co/api/v2', session: 'main' } },
      },
    });
    // `session` is the session codegen's concern — it must not leak into the definition literal.
    expect(src).not.toContain('session:');
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
