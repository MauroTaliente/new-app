export type OpenApiIncludeExclude = {
  tags?: string[];
  operationIds?: string[];
};

export type OpenApiValidateConfig =
  | boolean
  | {
      params?: boolean;
      response?: boolean;
      mode?: 'log' | 'strict';
    };

export type OpenApiOperationConfig = {
  fetchOnMount?: boolean;
  verbose?: boolean;
  initData?: string | false;
  security?: 'public';
  validate?: OpenApiValidateConfig;
};

export type OpenApiInitDataConfig = {
  input: string;
  generate?: boolean;
};

/** HTTP client defaults when scope is derived from OpenAPI (OpenAPI-first). */
export type OpenApiClientConfig = {
  headers?: Record<string, string>;
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  credentials?: 'omit' | 'same-origin' | 'include';
};

export type OpenApiFileConfig = {
  input: string;
  scope: string;
  typesOutput: string;
  zodOutput: string;
  sdkOutput: string;
  hooksOutput: string;
  initData?: OpenApiInitDataConfig;
  /** Merged into derived `apis.<scope>.url` with `servers[0].url` when `apis.<scope>` is omitted. */
  basePath?: string;
  /** Optional transport overrides for OpenAPI-first scopes. */
  client?: OpenApiClientConfig;
  /** Runtime Zod validation for params/response (log or strict). */
  validate?: OpenApiValidateConfig;
  include?: OpenApiIncludeExclude;
  exclude?: OpenApiIncludeExclude;
  operations?: Record<string, OpenApiOperationConfig>;
  defaults?: {
    fetchOnMount?: boolean;
    verbose?: boolean;
    validate?: OpenApiValidateConfig;
  };
};

export type React33OpenApiConfig = {
  files: Record<string, OpenApiFileConfig>;
};

export function readReact33OpenApiConfig(configJson: unknown): React33OpenApiConfig | null {
  const root = configJson as Record<string, unknown> | null;
  const networking = root?.react33Networking as Record<string, unknown> | undefined;
  const openApi = networking?.openApi as React33OpenApiConfig | undefined;
  if (!openApi?.files || typeof openApi.files !== 'object') return null;
  return openApi;
}

export function collectApiNamesFromConfig(configJson: unknown): string[] {
  const root = configJson as Record<string, unknown> | null;
  const apis = root?.react33Networking as Record<string, unknown> | undefined;
  const map = apis?.apis;
  if (!map || typeof map !== 'object' || Array.isArray(map)) return [];
  return Object.keys(map);
}
