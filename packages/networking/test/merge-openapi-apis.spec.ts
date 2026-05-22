import { describe, it, expect } from 'vitest';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeOpenApiIntoApisConfig } from '../src/merge-openapi-apis.js';
import { joinServerUrlAndBasePath } from '../src/openapi/derive-client-url.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const configDir = resolve(testDir, '../../../apps/demo');

describe('joinServerUrlAndBasePath', () => {
  it('joins server url and basePath', () => {
    expect(joinServerUrlAndBasePath('https://pokeapi.co', '/api/v2')).toBe(
      'https://pokeapi.co/api/v2',
    );
    expect(joinServerUrlAndBasePath('https://pokeapi.co/', '/api/v2/')).toBe(
      'https://pokeapi.co/api/v2',
    );
  });
});

describe('mergeOpenApiIntoApisConfig', () => {
  it('derives apis.pokemon from OpenAPI when apis block is omitted', async () => {
    const merged = (await mergeOpenApiIntoApisConfig(
      {
        react33Networking: {
          openApi: {
            files: {
              pokemon: {
                specSource: './openapi/pokeapi.openapi.yaml',
                scope: 'pokemon',
                basePath: '/api/v2',
                typesOutput: './src/api/pokemon.openapi.types.ts',
                zodOutput: './src/api/pokemon.openapi.zod.ts',
                sdkOutput: './src/api/pokemon.openapi.ts',
                hooksOutput: './src/api/pokemon.openapi.client.tsx',
                include: { operationIds: ['pokemon_list', 'pokemon_retrieve'] },
              },
            },
          },
        },
      },
      configDir,
    )) as Record<string, unknown>;

    const apis = (merged.react33Networking as Record<string, unknown>).apis as Record<
      string,
      { url: string }
    >;
    expect(apis.pokemon.url).toBe('https://pokeapi.co/api/v2');
  });

  it('manual apis entry wins over OpenAPI derivation', async () => {
    const merged = (await mergeOpenApiIntoApisConfig(
      {
        react33Networking: {
          apis: { pokemon: { url: 'https://override.test' } },
          openApi: {
            files: {
              pokemon: {
                specSource: './openapi/pokeapi.openapi.yaml',
                scope: 'pokemon',
                basePath: '/api/v2',
                typesOutput: './t.ts',
                zodOutput: './z.ts',
                sdkOutput: './s.ts',
                hooksOutput: './h.tsx',
              },
            },
          },
        },
      },
      configDir,
    )) as Record<string, unknown>;

    const apis = (merged.react33Networking as Record<string, unknown>).apis as Record<
      string,
      { url: string }
    >;
    expect(apis.pokemon.url).toBe('https://override.test');
  });
});
