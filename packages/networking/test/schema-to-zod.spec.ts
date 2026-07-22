import { describe, it, expect } from 'vitest';
import { buildOperationParamsSchema, schemaToZodExpr } from '../src/openapi/schema-to-zod.js';

function emptyCtx() {
  return { schemas: {} as Record<string, Record<string, unknown>>, emitted: new Set<string>(), lines: [] as string[] };
}

describe('schemaToZodExpr nullable', () => {
  it('emits .nullable() for OpenAPI 3.0 nullable: true on optional string', () => {
    const expr = schemaToZodExpr(emptyCtx(), {
      type: 'object',
      properties: {
        previous: { type: 'string', format: 'uri', nullable: true },
        count: { type: 'integer' },
      },
      required: ['count'],
    });
    expect(expr).toContain('previous: z.string().url().nullable().optional()');
    expect(expr).toContain('count: z.number().int()');
  });

  it('emits .nullable() without .optional() when property is required', () => {
    const expr = schemaToZodExpr(emptyCtx(), {
      type: 'object',
      properties: {
        label: { type: 'string', nullable: true },
      },
      required: ['label'],
    });
    expect(expr).toContain('label: z.string().nullable()');
    expect(expr).not.toContain('label: z.string().nullable().optional()');
  });

  it('emits .nullable() for type array including null', () => {
    const expr = schemaToZodExpr(emptyCtx(), {
      type: 'object',
      properties: {
        next: { type: ['string', 'null'], format: 'uri' },
      },
    });
    expect(expr).toContain('next: z.string().url().nullable().optional()');
  });
});

describe('buildOperationParamsSchema', () => {
  it('returns optional empty object when operation has no params', () => {
    const expr = buildOperationParamsSchema(emptyCtx(), 'ListItems', [], [], null);
    expect(expr).toBe('z.object({}).optional()');
  });

  it('emits path and optional query groups', () => {
    const expr = buildOperationParamsSchema(
      emptyCtx(),
      'GetItem',
      [{ name: 'id', required: true, schema: { type: 'string' } }],
      [{ name: 'verbose', required: false, schema: { type: 'boolean' } }],
      null,
    );
    expect(expr).toContain('path: z.object({ id: z.string() })');
    expect(expr).toContain('query: z.object({ verbose: z.boolean().optional() }).optional()');
  });
});

describe('schemaToZodExpr anyOf', () => {
  function ctxWith(name: string, schema: Record<string, unknown>) {
    return { schemas: { [name]: schema }, emitted: new Set<string>(), lines: [] as string[] };
  }

  it('collapses the 3.1 nullable-$ref union to Ref.nullable()', () => {
    // OpenAPI 3.1 has no `nullable` keyword, and a `$ref` cannot carry sibling
    // keywords — so `X | null` for a component is spelled exactly like this.
    const ctx = ctxWith('Location', {
      type: 'object',
      properties: { lat: { type: 'number' }, lng: { type: 'number' } },
      required: ['lat', 'lng'],
    });
    const expr = schemaToZodExpr(ctx, {
      anyOf: [{ $ref: '#/components/schemas/Location' }, { type: 'null' }],
    });
    expect(expr).toBe('LocationSchema.nullable()');
    expect(ctx.lines.join('\n')).toContain('export const LocationSchema =');
  });

  it('collapses a nullable scalar union', () => {
    const expr = schemaToZodExpr(emptyCtx(), {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    });
    expect(expr).toBe('z.string().nullable()');
  });

  it('emits a union for a real multi-member anyOf', () => {
    const expr = schemaToZodExpr(emptyCtx(), {
      anyOf: [{ type: 'string' }, { type: 'integer' }],
    });
    expect(expr).toBe('z.union([z.string(), z.number().int()])');
  });

  it('emits a nullable union when null joins a real multi-member anyOf', () => {
    const expr = schemaToZodExpr(emptyCtx(), {
      anyOf: [{ type: 'string' }, { type: 'boolean' }, { type: 'null' }],
    });
    expect(expr).toBe('z.union([z.string(), z.boolean()]).nullable()');
  });

  it('handles a nullable $ref nested in an object property', () => {
    const ctx = ctxWith('Media', {
      type: 'object',
      properties: { media_url: { type: 'string' } },
      required: ['media_url'],
    });
    const expr = schemaToZodExpr(ctx, {
      type: 'object',
      properties: {
        logo: { anyOf: [{ $ref: '#/components/schemas/Media' }, { type: 'null' }] },
      },
      required: ['logo'],
    });
    expect(expr).toContain('logo: MediaSchema.nullable()');
  });

  it('does not double-wrap when the member is already nullable', () => {
    const expr = schemaToZodExpr(emptyCtx(), {
      anyOf: [{ type: 'string', nullable: true }, { type: 'null' }],
    });
    expect(expr).toBe('z.string().nullable()');
  });
});
