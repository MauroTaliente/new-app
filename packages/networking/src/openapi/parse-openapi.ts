import SwaggerParser from '@apidevtools/swagger-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { OpenApiFileConfig, OpenApiIncludeExclude } from './config-types';
import { refNameFromRef } from './naming';

export type ParsedParameter = {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  schema: Record<string, unknown>;
};

export type ParsedOperation = {
  operationId: string;
  method: string;
  pathTemplate: string;
  tags: string[];
  summary?: string;
  pathParams: ParsedParameter[];
  queryParams: ParsedParameter[];
  bodySchema: Record<string, unknown> | null;
  bodySchemaName: string | null;
  successStatus: string;
  responseSchema: Record<string, unknown> | null;
  responseSchemaName: string | null;
  hasBody: boolean;
  operation: Record<string, unknown>;
  pathLevelSecurity?: Record<string, string[]>[];
};

export type ParsedOpenApiDocument = {
  openapi: string;
  operations: ParsedOperation[];
  schemas: Record<string, Record<string, unknown>>;
  document: Record<string, unknown>;
};

function parseOpenApiVersion(v: string): [number, number, number] {
  const [a = 0, b = 0, c = 0] = v.split('.').map((x) => Number.parseInt(x, 10));
  return [a, b, c];
}

export function assertOpenApi31Plus(openapiVersion: string): void {
  const [major, minor] = parseOpenApiVersion(openapiVersion);
  if (major < 3 || (major === 3 && minor < 1)) {
    throw new Error(`OpenAPI ${openapiVersion} is not supported; require >= 3.1.0`);
  }
}

function componentSchemaName(
  schema: Record<string, unknown> | null,
  schemas: Record<string, Record<string, unknown>>,
): string | null {
  if (!schema) return null;
  if (schema.$ref && typeof schema.$ref === 'string') {
    return refNameFromRef(schema.$ref);
  }
  for (const [name, component] of Object.entries(schemas)) {
    if (component === schema) return name;
  }
  return null;
}

function deref(schema: unknown, doc: Record<string, unknown>): Record<string, unknown> {
  if (!schema || typeof schema !== 'object') return {};
  const s = schema as Record<string, unknown>;
  if (s.$ref && typeof s.$ref === 'string') {
    const name = refNameFromRef(s.$ref);
    const components = doc.components as Record<string, unknown> | undefined;
    const schemas = components?.schemas as Record<string, Record<string, unknown>> | undefined;
    if (name && schemas?.[name]) return schemas[name];
  }
  return s;
}

function resolveResponseSchema(
  responses: Record<string, unknown> | undefined,
  doc: Record<string, unknown>,
): { status: string; schema: Record<string, unknown> | null; schemaName: string | null } {
  if (!responses) return { status: '200', schema: null, schemaName: null };
  const priority = ['200', '201', '204', 'default'];
  for (const status of priority) {
    const res = responses[status] as Record<string, unknown> | undefined;
    if (!res) continue;
    if (status === '204') return { status, schema: null, schemaName: null };
    let content = res.content as Record<string, Record<string, unknown>> | undefined;
    if (!content && res.$ref) {
      const ref = res.$ref as string;
      const components = doc.components as Record<string, unknown> | undefined;
      const responsesComp = components?.responses as Record<string, Record<string, unknown>> | undefined;
      const name = ref.replace('#/components/responses/', '');
      const resolved = responsesComp?.[name];
      content = resolved?.content as Record<string, Record<string, unknown>> | undefined;
    }
    const json = content?.['application/json'];
    const schema = json?.schema ? deref(json.schema, doc) : null;
    const schemaName =
      json?.schema && typeof (json.schema as Record<string, unknown>).$ref === 'string'
        ? refNameFromRef((json.schema as Record<string, unknown>).$ref as string)
        : null;
    return { status, schema, schemaName };
  }
  return { status: '200', schema: null, schemaName: null };
}

function matchesFilter(
  op: { operationId: string; tags: string[] },
  include?: OpenApiIncludeExclude,
  exclude?: OpenApiIncludeExclude,
): boolean {
  if (exclude?.operationIds?.includes(op.operationId)) return false;
  if (exclude?.tags?.length && op.tags.some((t) => exclude.tags!.includes(t))) return false;
  if (include?.operationIds?.length) return include.operationIds.includes(op.operationId);
  if (include?.tags?.length) return op.tags.some((t) => include.tags!.includes(t));
  return true;
}

function normalizeParameters(
  raw: unknown[] | undefined,
  doc: Record<string, unknown>,
): ParsedParameter[] {
  if (!raw) return [];
  const out: ParsedParameter[] = [];
  for (const p of raw) {
    const param = p as Record<string, unknown>;
    if (param.$ref && typeof param.$ref === 'string') {
      const name = param.$ref.replace('#/components/parameters/', '');
      const components = doc.components as Record<string, unknown> | undefined;
      const params = components?.parameters as Record<string, Record<string, unknown>> | undefined;
      if (params?.[name]) {
        out.push(...normalizeParameters([params[name]], doc));
      }
      continue;
    }
    const loc = param.in as ParsedParameter['in'];
    if (loc !== 'path' && loc !== 'query') continue;
    out.push({
      name: param.name as string,
      in: loc,
      required: Boolean(param.required),
      schema: deref(param.schema, doc),
    });
  }
  return out;
}

export async function parseOpenApiFile(
  specPath: string,
  fileConfig: OpenApiFileConfig,
): Promise<ParsedOpenApiDocument> {
  const abs = resolve(specPath);
  const raw = readFileSync(abs, 'utf8');
  const doc = (abs.endsWith('.json') ? JSON.parse(raw) : parseYaml(raw)) as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundled = (await SwaggerParser.dereference(doc as any, {
    resolve: { external: false },
    dereference: { circular: 'ignore' },
  })) as Record<string, unknown>;
  const openapi = String(bundled.openapi ?? '');
  assertOpenApi31Plus(openapi);

  const components = bundled.components as Record<string, unknown> | undefined;
  const schemas = (components?.schemas ?? {}) as Record<string, Record<string, unknown>>;

  const paths = bundled.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) {
    return { openapi, operations: [], schemas, document: bundled };
  }

  const operations: ParsedOperation[] = [];
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    const pathLevelParams = normalizeParameters(pathItem.parameters as unknown[] | undefined, bundled);
    const pathLevelSecurity = pathItem.security as Record<string, string[]>[] | undefined;
    let pathTemplate = pathKey;
    if (fileConfig.basePath && pathKey.startsWith(fileConfig.basePath)) {
      pathTemplate = pathKey.slice(fileConfig.basePath.length) || '/';
    }

    for (const method of methods) {
      const op = pathItem[method] as Record<string, unknown> | undefined;
      if (!op) continue;
      const operationId = op.operationId as string | undefined;
      if (!operationId) {
        throw new Error(`OpenAPI: missing operationId for ${method.toUpperCase()} ${pathKey}`);
      }

      const tags = (op.tags as string[] | undefined) ?? [];
      if (!matchesFilter({ operationId, tags }, fileConfig.include, fileConfig.exclude)) continue;

      const allParams = [
        ...pathLevelParams,
        ...normalizeParameters(op.parameters as unknown[] | undefined, bundled),
      ];
      const pathParams = allParams.filter((p) => p.in === 'path');
      const queryParams = allParams.filter((p) => p.in === 'query');

      let bodySchema: Record<string, unknown> | null = null;
      let bodySchemaName: string | null = null;
      const requestBody = op.requestBody as Record<string, unknown> | undefined;
      if (requestBody?.content) {
        const content = requestBody.content as Record<string, Record<string, unknown>>;
        const json = content['application/json'];
        if (json?.schema) {
          const raw = json.schema as Record<string, unknown>;
          bodySchema = deref(raw, bundled);
          bodySchemaName = componentSchemaName(bodySchema, schemas);
        }
      }

      const { status, schema, schemaName } = resolveResponseSchema(
        op.responses as Record<string, unknown> | undefined,
        bundled,
      );

      operations.push({
        operationId,
        method: method.toUpperCase(),
        pathTemplate,
        tags,
        summary: op.summary as string | undefined,
        pathParams,
        queryParams,
        bodySchema,
        bodySchemaName,
        successStatus: status,
        responseSchema: schema,
        responseSchemaName: schemaName,
        hasBody: status !== '204' && schema !== null,
        operation: op,
        pathLevelSecurity,
      });
    }
  }

  return { openapi, operations, schemas, document: bundled };
}
