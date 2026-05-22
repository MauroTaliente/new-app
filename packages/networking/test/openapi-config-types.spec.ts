import { describe, it, expect } from 'vitest';
import {
  readReact33OpenApiConfig,
  collectApiNamesFromConfig,
} from '../src/openapi/config-types.js';

describe('readReact33OpenApiConfig', () => {
  it('returns openApi when files map exists', () => {
    const cfg = readReact33OpenApiConfig({
      react33Networking: {
        openApi: { files: { demo: { specSource: './x.yaml', scope: 'demo' } } },
      },
    });
    expect(cfg?.files.demo.scope).toBe('demo');
  });

  it('returns null when openApi.files is missing', () => {
    expect(readReact33OpenApiConfig({ react33Networking: {} })).toBeNull();
    expect(readReact33OpenApiConfig(null)).toBeNull();
  });
});

describe('collectApiNamesFromConfig', () => {
  it('lists keys from react33Networking.apis', () => {
    expect(
      collectApiNamesFromConfig({
        react33Networking: { apis: { pokemon: { url: 'https://x' }, admin: { url: 'https://y' } } },
      }),
    ).toEqual(['pokemon', 'admin']);
  });

  it('returns empty array when apis is absent or not an object', () => {
    expect(collectApiNamesFromConfig({})).toEqual([]);
    expect(collectApiNamesFromConfig({ react33Networking: { apis: [] } })).toEqual([]);
  });
});
