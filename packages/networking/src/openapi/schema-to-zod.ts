/* eslint-disable @typescript-eslint/no-explicit-any */
import { refNameFromRef } from './naming';

export type SchemaContext = {
  schemas: Record<string, Record<string, unknown>>;
  emitted: Set<string>;
  lines: string[];
};

function schemaType(schema: Record<string, unknown>): string | string[] | undefined {
  const t = schema.type;
  if (typeof t === 'string') return t;
  if (Array.isArray(t)) return t.filter((x) => x !== 'null') as string[];
  return undefined;
}

function isNullable(schema: Record<string, unknown>): boolean {
  if (schema.nullable === true) return true;
  const t = schema.type;
  if (Array.isArray(t) && t.includes('null')) return true;
  return false;
}

function emitSchema(ctx: SchemaContext, name: string, schema: Record<string, unknown>): void {
  if (ctx.emitted.has(name)) return;
  ctx.emitted.add(name);

  const expr = schemaToZodExpr(ctx, schema, name);
  ctx.lines.push(`export const ${name}Schema = ${expr};`);
}

/** Only schemas reachable via $ref from included operations are emitted. */
export function emitComponentSchemas(_ctx: SchemaContext): void {
  /* no-op */
}

function zodObjectKey(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

export function schemaToZodExpr(
  ctx: SchemaContext,
  schema: Record<string, unknown>,
  selfName?: string,
): string {
  if (schema.$ref && typeof schema.$ref === 'string') {
    const refName = refNameFromRef(schema.$ref);
    if (refName) {
      if (!ctx.emitted.has(refName) && ctx.schemas[refName]) {
        emitSchema(ctx, refName, ctx.schemas[refName]);
      }
      const base = `${refName}Schema`;
      return isNullable(schema) ? `${base}.nullable()` : base;
    }
    return 'z.unknown()';
  }

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const discriminator = schema.discriminator as
      | { propertyName?: string; mapping?: Record<string, string> }
      | undefined;
    if (discriminator?.propertyName && discriminator.mapping) {
      const prop = discriminator.propertyName;
      const variants: string[] = [];
      for (const refPath of Object.values(discriminator.mapping)) {
        const refName = refNameFromRef(refPath);
        if (refName && ctx.schemas[refName]) {
          emitSchema(ctx, refName, ctx.schemas[refName]);
          variants.push(`${refName}Schema`);
        }
      }
      if (variants.length >= 2) {
        const du = `z.discriminatedUnion('${prop}', [${variants.join(', ')}])`;
        return isNullable(schema) ? `${du}.nullable()` : du;
      }
    }
    const parts = schema.oneOf.map((s, i) =>
      schemaToZodExpr(ctx, s as Record<string, unknown>, `${selfName}One${i}`),
    );
    const union = `z.union([${parts.join(', ')}])`;
    return isNullable(schema) ? `${union}.nullable()` : union;
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    const parts = schema.allOf.map((s, i) => schemaToZodExpr(ctx, s as Record<string, unknown>, `${selfName}All${i}`));
    if (parts.length === 1) return parts[0];
    return parts.reduce((acc, cur) => `z.intersection(${acc}, ${cur})`);
  }

  const type = schemaType(schema);
  const types = Array.isArray(type) ? type : type ? [type] : [];

  if (types.includes('object') || schema.properties) {
    return objectToZod(ctx, schema);
  }

  if (types.includes('array') || schema.items) {
    const items = schema.items as Record<string, unknown>;
    const inner = schemaToZodExpr(ctx, items, `${selfName}Item`);
    let arr = `z.array(${inner})`;
    if (typeof schema.maxItems === 'number') arr += `.max(${schema.maxItems})`;
    return isNullable(schema) ? `${arr}.nullable()` : arr;
  }

  if (schema.enum && Array.isArray(schema.enum)) {
    const vals = schema.enum.map((v) => JSON.stringify(v)).join(', ');
    let e = `z.enum([${vals}] as const)`;
    if (isNullable(schema)) e += '.nullable()';
    return e;
  }

  if (schema.const !== undefined) {
    return `z.literal(${JSON.stringify(schema.const)})`;
  }

  if (types.includes('integer') || types.includes('number')) {
    let n = types.includes('integer') ? 'z.number().int()' : 'z.number()';
    if (typeof schema.minimum === 'number') n += `.min(${schema.minimum})`;
    if (typeof schema.maximum === 'number') n += `.max(${schema.maximum})`;
    return isNullable(schema) ? `${n}.nullable()` : n;
  }

  if (types.includes('boolean')) {
    const b = 'z.boolean()';
    return isNullable(schema) ? `${b}.nullable()` : b;
  }

  if (types.includes('string') || schema.format) {
    let s = 'z.string()';
    if (schema.format === 'email') s += '.email()';
    if (schema.format === 'uuid') s += '.uuid()';
    if (schema.format === 'uri') s += '.url()';
    if (typeof schema.minLength === 'number') s += `.min(${schema.minLength})`;
    if (typeof schema.maxLength === 'number') s += `.max(${schema.maxLength})`;
    if (typeof schema.pattern === 'string') {
      s += `.regex(new RegExp(${JSON.stringify(schema.pattern)}))`;
    }
    return isNullable(schema) ? `${s}.nullable()` : s;
  }

  return 'z.unknown()';
}

function objectToZod(ctx: SchemaContext, schema: Record<string, unknown>): string {
  const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
  if (!props) {
    const base = 'z.record(z.string(), z.unknown())';
    return isNullable(schema) ? `${base}.nullable()` : base;
  }

  const required = new Set((schema.required as string[] | undefined) ?? []);
  const entries: string[] = [];
  for (const [key, propSchema] of Object.entries(props)) {
    let field = schemaToZodExpr(ctx, propSchema, key);
    if (!required.has(key)) field += '.optional()';
    entries.push(`${zodObjectKey(key)}: ${field}`);
  }

  let obj = `z.object({\n    ${entries.join(',\n    ')},\n  })`;
  if (schema.additionalProperties === false) {
    obj += '.strict()';
  }
  return isNullable(schema) ? `${obj}.nullable()` : obj;
}

export function buildOperationParamsSchema(
  ctx: SchemaContext,
  pascal: string,
  pathParams: { name: string; required: boolean; schema: Record<string, unknown> }[],
  queryParams: { name: string; required: boolean; schema: Record<string, unknown> }[],
  bodySchema: Record<string, unknown> | null,
  bodySchemaName?: string | null,
): string {
  const parts: string[] = [];

  if (pathParams.length > 0) {
    const pathFields = pathParams.map((p) => {
      let f = schemaToZodExpr(ctx, p.schema, `${pascal}Path${p.name}`);
      if (!p.required) f += '.optional()';
      return `${p.name}: ${f}`;
    });
    parts.push(`path: z.object({ ${pathFields.join(', ')} })`);
  }

  if (queryParams.length > 0) {
    const queryFields = queryParams.map((p) => {
      let f = schemaToZodExpr(ctx, p.schema, `${pascal}Query${p.name}`);
      if (!p.required) f += '.optional()';
      return `${p.name}: ${f}`;
    });
    parts.push(`query: z.object({ ${queryFields.join(', ')} }).optional()`);
  }

  if (bodySchema) {
    if (bodySchemaName && ctx.schemas[bodySchemaName]) {
      if (!ctx.emitted.has(bodySchemaName)) {
        emitSchema(ctx, bodySchemaName, ctx.schemas[bodySchemaName]);
      }
      parts.push(`body: ${bodySchemaName}Schema`);
    } else {
      parts.push(`body: ${schemaToZodExpr(ctx, bodySchema, `${pascal}Body`)}`);
    }
  }

  if (parts.length === 0) {
    return 'z.object({}).optional()';
  }

  return `z.object({\n    ${parts.join(',\n    ')},\n  })`;
}
