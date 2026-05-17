import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeOpenApiBundles } from '../src/generate-openapi-bundle.js';
import { deriveClientBaseUrl } from '../src/openapi/derive-client-url.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const demoDir = resolve(testDir, '../../../apps/demo');
const pokeapiYaml = join(demoDir, 'openapi/pokeapi.openapi.yaml');

describe('deriveClientBaseUrl', () => {
  it('throws when servers[0].url is missing', () => {
    expect(() => deriveClientBaseUrl({ openapi: '3.1.0' })).toThrow(
      /servers\[0\]\.url/,
    );
  });
});

describe('writeOpenApiBundles', () => {
  it('throws when scope is not listed in react33Networking.apis', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'openapi-bundle-'));
    try {
      await expect(
        writeOpenApiBundles(
          {
            react33Networking: {
              apis: { other: { url: 'https://example.com' } },
              openApi: {
                files: {
                  pokemon: {
                    input: './openapi/pokeapi.openapi.yaml',
                    scope: 'pokemon',
                    basePath: '/api/v2',
                    typesOutput: join(tmp, 't.ts'),
                    zodOutput: join(tmp, 'z.ts'),
                    sdkOutput: join(tmp, 's.ts'),
                    hooksOutput: join(tmp, 'h.tsx'),
                    include: { operationIds: ['pokemon_list'] },
                  },
                },
              },
            },
          },
          demoDir,
          join(tmp, 'apis.generated.ts'),
        ),
      ).rejects.toThrow(/scope "pokemon"/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('no-ops when react33Networking.openApi is absent', async () => {
    await expect(
      writeOpenApiBundles({ react33Networking: { apis: {} } }, tmpdir(), '/noop/apis.ts'),
    ).resolves.toBeUndefined();
  });

  it('throws when required OpenAPI outputs are missing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'openapi-bundle-'));
    try {
      await expect(
        writeOpenApiBundles(
          {
            react33Networking: {
              apis: { pokemon: { url: 'https://pokeapi.co' } },
              openApi: {
                files: {
                  pokemon: {
                    input: './openapi/pokeapi.openapi.yaml',
                    scope: 'pokemon',
                    basePath: '/api/v2',
                    typesOutput: '',
                    zodOutput: join(tmp, 'z.ts'),
                    sdkOutput: join(tmp, 's.ts'),
                    hooksOutput: join(tmp, 'h.tsx'),
                  },
                },
              },
            },
          },
          demoDir,
          join(tmp, 'apis.generated.ts'),
        ),
      ).rejects.toThrow(/typesOutput, zodOutput, sdkOutput, hooksOutput are required/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
