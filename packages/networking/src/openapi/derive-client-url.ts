/** Join OpenAPI `servers[0].url` with optional `basePath` for createDataFlow base URL. */
export function joinServerUrlAndBasePath(serverUrl: string, basePath?: string): string {
  const base = serverUrl.replace(/\/$/, '');
  if (!basePath) return base;
  const path = basePath.startsWith('/') ? basePath : `/${basePath}`;
  const suffix = path.replace(/\/$/, '');
  return suffix ? `${base}${suffix}` : base;
}

export function deriveClientBaseUrl(
  document: Record<string, unknown>,
  basePath?: string,
): string {
  const servers = document.servers as Array<{ url?: string }> | undefined;
  const serverUrl = servers?.[0]?.url;
  if (!serverUrl || typeof serverUrl !== 'string') {
    throw new Error(
      'OpenAPI-first: spec must define servers[0].url when react33Networking.apis.<scope> is omitted',
    );
  }
  return joinServerUrlAndBasePath(serverUrl, basePath);
}
