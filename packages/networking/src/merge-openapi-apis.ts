import { resolve } from 'node:path';
import type { ApiDefinitionJson } from './generate-react33-apis.js';
import {
  readReact33OpenApiConfig,
  type OpenApiClientConfig,
  type OpenApiFileConfig,
} from './openapi/config-types.js';
import { deriveClientBaseUrl } from './openapi/derive-client-url.js';
import { parseOpenApiFile } from './openapi/parse-openapi.js';

function cloneConfigJson(configJson: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(configJson)) as Record<string, unknown>;
}

function toApiDefinition(client: OpenApiClientConfig | undefined, url: string): ApiDefinitionJson {
  return {
    url,
    headers: client?.headers,
    cache: client?.cache,
    credentials: client?.credentials,
  };
}

async function deriveApiFromOpenApiFile(
  configDir: string,
  fileConfig: OpenApiFileConfig,
): Promise<ApiDefinitionJson> {
  const specPath = resolve(configDir, fileConfig.specSource);
  const parsed = await parseOpenApiFile(specPath, fileConfig);
  const url = deriveClientBaseUrl(parsed.document, fileConfig.basePath);
  return toApiDefinition(fileConfig.client, url);
}

/**
 * Merge `react33Networking.apis` with OpenAPI-first entries: manual `apis.<scope>` wins;
 * missing scopes get `url` from `servers[0]` + `basePath` and optional `client` overrides.
 */
export async function mergeOpenApiIntoApisConfig(
  configJson: unknown,
  configDir: string,
): Promise<unknown> {
  const openApi = readReact33OpenApiConfig(configJson);
  if (!openApi) return configJson;

  const root = cloneConfigJson(configJson);
  const networking = root.react33Networking as Record<string, unknown> | undefined;
  if (!networking || typeof networking !== 'object') {
    throw new Error('react33.config.json: react33Networking is required when openApi.files is set');
  }

  const manual = networking.apis;
  const merged: Record<string, ApiDefinitionJson> =
    manual && typeof manual === 'object' && !Array.isArray(manual)
      ? { ...(manual as Record<string, ApiDefinitionJson>) }
      : {};

  for (const [bundleKey, fileConfig] of Object.entries(openApi.files)) {
    const { scope } = fileConfig;
    if (merged[scope]) continue;
    merged[scope] = await deriveApiFromOpenApiFile(configDir, fileConfig);
  }

  networking.apis = merged;
  return root;
}
