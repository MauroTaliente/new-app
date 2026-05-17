type SecurityReq = Record<string, string[]>;

export type OperationSecurityMeta = {
  isPublic: boolean;
  schemeNames: string[];
  javadocLines: string[];
};

export function resolveOperationSecurity(
  operation: Record<string, unknown>,
  document: Record<string, unknown>,
  pathLevelSecurity?: SecurityReq[] | undefined,
): OperationSecurityMeta {
  const opSecurity = operation.security as SecurityReq[] | undefined;
  const globalSecurity = document.security as SecurityReq[] | undefined;
  const effective =
    opSecurity !== undefined ? opSecurity : pathLevelSecurity !== undefined ? pathLevelSecurity : globalSecurity;

  const isPublic = Array.isArray(effective) && effective.length === 0;
  const schemeNames = new Set<string>();

  if (!isPublic && Array.isArray(effective)) {
    for (const req of effective) {
      for (const name of Object.keys(req)) {
        schemeNames.add(name);
      }
    }
  }

  const components = document.components as Record<string, unknown> | undefined;
  const schemes = (components?.securitySchemes ?? {}) as Record<string, Record<string, unknown>>;
  const schemeLines: string[] = [];
  for (const name of schemeNames) {
    const scheme = schemes[name];
    if (!scheme) {
      schemeLines.push(`${name}`);
      continue;
    }
    if (scheme.type === 'http') {
      schemeLines.push(`${name} (http ${scheme.scheme ?? 'auth'})`);
    } else if (scheme.type === 'apiKey') {
      schemeLines.push(`${name} (apiKey ${scheme.in})`);
    } else {
      schemeLines.push(`${name} (${scheme.type})`);
    }
  }

  const javadocLines = isPublic
    ? [
        ' * @openapi-security public',
        ' * @openapi-security-schemes none',
        ' * Public route — optional auth from scope load is not required by the spec.',
      ]
    : [
        ` * @openapi-security ${[...schemeNames].join(', ') || 'required'}`,
        ` * @openapi-security-schemes ${schemeLines.length ? schemeLines.join('; ') : 'see OpenAPI spec'}`,
        ' * Wire auth via createApiRegistry loads for this scope (AuthProfile / LoadRequestProps).',
      ];

  return {
    isPublic,
    schemeNames: [...schemeNames],
    javadocLines,
  };
}

export function formatSecurityJSDoc(meta: OperationSecurityMeta, scope: string): string {
  return [
    '/**',
    ...meta.javadocLines,
    ` * @openapi-scope ${scope}`,
    ' */',
  ].join('\n');
}
