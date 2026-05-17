/** Replace `{param}` segments in an OpenAPI path template. */
export function buildPathUrl(
  template: string,
  pathParams: Record<string, string | number | undefined> = {},
): string {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = pathParams[key];
    if (value === undefined || value === null) {
      throw new Error(`buildPathUrl: missing path param "${key}" for template "${template}"`);
    }
    return encodeURIComponent(String(value));
  });
}

export type OpenApiOperationParams = {
  path?: Record<string, string | number | undefined>;
  query?: Record<string, unknown>;
  body?: unknown;
};

/** Build relative URL + body for createDataFlow from structured operation params. */
export function resolveOpenApiRequest(
  pathTemplate: string,
  method: string,
  params: OpenApiOperationParams = {},
): { url: string; body?: unknown } {
  const url = buildPathUrl(pathTemplate, params.path ?? {});
  const upper = method.toUpperCase();
  if (upper === 'GET' || upper === 'HEAD' || upper === 'DELETE') {
    return { url, body: params.query };
  }
  return { url, body: params.body ?? params.query };
}
