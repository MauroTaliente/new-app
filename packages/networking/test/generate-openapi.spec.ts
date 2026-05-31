import { describe, it, expect } from 'vitest';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOpenApiFile } from '../src/openapi/parse-openapi.js';
import {
  generateZodModuleSource,
  generateTypesModuleSource,
  generateSdkModuleSource,
  generateHooksModuleSource,
  generateOpenApiBundle,
} from '../src/openapi/generate-openapi.js';
import { operationIdToPascal } from '../src/openapi/naming.js';
import type { OpenApiFileConfig } from '../src/openapi/config-types.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const demoYaml = resolve(testDir, '../../config/data/fixtures/openapi-3.1-demo.yaml');

const fileConfig = {
  specSource: demoYaml,
  scope: 'admin',
  basePath: '/v1',
  typesOutput: './demo.openapi.types.ts',
  zodOutput: './demo.openapi.zod.ts',
  sdkOutput: './demo.openapi.ts',
  hooksOutput: './demo.openapi.client.tsx',
  include: { tags: ['trips', 'auth'] },
  operations: {
    listTrips: { fetchOnMount: true, initData: 'emptyPaginatedTrips' },
    login: { fetchOnMount: false, initData: false, validate: { params: false, response: false } },
  },
  defaults: { fetchOnMount: false, verbose: false },
  validate: { params: true, response: true, mode: 'log' },
} satisfies OpenApiFileConfig;

describe('operationIdToPascal', () => {
  it('handles snake_case operationIds', () => {
    expect(operationIdToPascal('pokemon_list')).toBe('PokemonList');
    expect(operationIdToPascal('listTrips')).toBe('ListTrips');
  });
});

describe('parseOpenApiFile', () => {
  it('parses demo yaml 3.1 with operationIds', async () => {
    const parsed = await parseOpenApiFile(demoYaml, fileConfig);
    expect(parsed.openapi).toMatch(/^3\.1/);
    const ids = parsed.operations.map((o) => o.operationId);
    expect(ids).toContain('listTrips');
    expect(ids).toContain('login');
    expect(ids).not.toContain('addTripMember');
  });
});

describe('generateOpenApi sources', () => {
  it('emits zod, types, sdk, hooks with security comments', async () => {
    const parsed = await parseOpenApiFile(demoYaml, fileConfig);
    const zod = generateZodModuleSource(parsed);
    expect(zod).toContain('ListTripsParamsSchema');
    expect(zod).toContain("import { z } from 'zod'");

    const types = generateTypesModuleSource('./demo.openapi.zod.ts', parsed, '/tmp');
    expect(types).toContain('ListTripsHookOverrides');
    expect(types).toContain('OpenApiHookOverrides');

    const sdk = generateSdkModuleSource(
      parsed,
      fileConfig,
      { zod: '/tmp/demo.openapi.zod.ts', types: '/tmp/demo.openapi.types.ts', apis: '/tmp/apis.generated.ts' },
      '/tmp',
    );
    expect(sdk).toContain('export async function listTrips');
    expect(sdk).toContain('@openapi-security');
    expect(sdk).toContain('resolveOpenApiRequest');
    expect(sdk).toContain('validateOpenApiParams');
    expect(sdk).toContain('validateOpenApiResponse');
    expect(sdk).toContain('const verbose = options?.verbose ??');
    expect(sdk).toContain('verbose,');
    expect(sdk).toContain('listTripsValidateDefaults');
    expect(sdk).toContain('loginValidateDefaults');
    expect(JSON.parse(sdk.match(/loginValidateDefaults = (\{[^}]+\})/)?.[1] ?? '{}')).toEqual({
      params: false,
      response: false,
      mode: 'log',
    });

    const hooks = generateHooksModuleSource(
      parsed,
      fileConfig,
      {
        sdk: '/tmp/demo.openapi.ts',
        types: '/tmp/demo.openapi.types.ts',
        apisHooks: '/tmp/apis.client.generated.tsx',
        initData: '/tmp/demo.init-data.ts',
      },
      '/tmp',
    );
    expect(hooks).toContain('useListTrips');
    expect(hooks).toContain('options?: ListTripsHookOverrides');
    expect(hooks).not.toContain('watch: unknown[]');
    expect(hooks).toContain('ListTripsHookOverrides');
    expect(hooks).toContain("'use client'");
    expect(hooks).toContain('useListTrips');
    expect(hooks).toContain('{ verbose: options?.verbose ??');
  });

  it('emits .nullable() for OpenAPI nullable paginated fields (pokeapi)', async () => {
    const pokeapiYaml = resolve(testDir, '../../../apps/demo/openapi/pokeapi.openapi.yaml');
    const pokeapiFileConfig = {
      specSource: pokeapiYaml,
      scope: 'pokemon',
      basePath: '/api/v2',
      typesOutput: './pokemon.openapi.types.ts',
      zodOutput: './pokemon.openapi.zod.ts',
      sdkOutput: './pokemon.openapi.ts',
      hooksOutput: './pokemon.openapi.client.tsx',
      include: { operationIds: ['pokemon_list'] },
    } satisfies OpenApiFileConfig;
    const parsed = await parseOpenApiFile(pokeapiYaml, pokeapiFileConfig);
    const zod = generateZodModuleSource(parsed);
    expect(zod).toContain('previous: z.string().url().nullable().optional()');
    expect(zod).toContain('next: z.string().url().nullable().optional()');
  });

  it('generates init-data module when initData.generate is true', async () => {
    const bundle = await generateOpenApiBundle(
      demoYaml,
      { ...fileConfig, initData: { source: './demo.init-data.ts', generate: true } },
      {
        zod: '/tmp/demo.openapi.zod.ts',
        types: '/tmp/demo.openapi.types.ts',
        sdk: '/tmp/demo.openapi.ts',
        hooks: '/tmp/demo.openapi.client.tsx',
        initData: '/tmp/demo.init-data.ts',
        apis: '/tmp/apis.generated.ts',
        apisHooks: '/tmp/apis.client.generated.tsx',
      },
    );
    expect(bundle.initDataSource).toContain('satisfies ListTripsData');
    expect(bundle.initDataSource).toMatch(/export const empty\w+ = /);
  });

  it('emits skipLoad: true only for public operations in the SDK', async () => {
    const parsed = await parseOpenApiFile(demoYaml, fileConfig);
    const sdk = generateSdkModuleSource(
      parsed,
      fileConfig,
      { zod: '/tmp/demo.openapi.zod.ts', types: '/tmp/demo.openapi.types.ts', apis: '/tmp/apis.generated.ts' },
      '/tmp',
    );

    // `login` is `security: []` → public → its scopeRequest call bypasses the load.
    const loginFn = sdk.slice(sdk.indexOf('export async function login('));
    expect(loginFn.slice(0, loginFn.indexOf('OpenApiMeta'))).toContain('skipLoad: true');

    // `listTrips` inherits the global `bearerAuth` → not public → no skipLoad.
    const listTripsFn = sdk.slice(sdk.indexOf('export async function listTrips('));
    expect(listTripsFn.slice(0, listTripsFn.indexOf('OpenApiMeta'))).not.toContain('skipLoad');
  });

  it('emits z.discriminatedUnion for AddMemberBody', async () => {
    const parsed = await parseOpenApiFile(demoYaml, {
      ...fileConfig,
      include: { tags: ['members'] },
    });
    const zod = generateZodModuleSource(parsed);
    expect(zod).toContain('AddMemberBodySchema = z.discriminatedUnion');
    expect(zod).toContain("'via'");
  });
});
