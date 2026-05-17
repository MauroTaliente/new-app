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
