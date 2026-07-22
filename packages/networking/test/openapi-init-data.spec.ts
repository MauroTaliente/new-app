import { describe, it, expect } from 'vitest';
import {
  schemaToEmptyLiteral,
  generateInitDataModuleSource,
  collectReferencedInitDataSymbols,
} from '../src/openapi/init-data.js';
import type { ParsedOperation } from '../src/openapi/parse-openapi.js';

describe('schemaToEmptyLiteral', () => {
  it('builds nested object from required fields', () => {
    expect(
      schemaToEmptyLiteral({
        type: 'object',
        properties: {
          count: { type: 'integer' },
          previous: { type: 'string', nullable: true },
        },
        required: ['count', 'previous'],
      }),
    ).toBe("{ count: 0, previous: '' }");
  });

  it('uses enum first value when present', () => {
    expect(schemaToEmptyLiteral({ enum: ['draft', 'published'] })).toBe('"draft"');
  });

  it('uses schema default when present', () => {
    expect(schemaToEmptyLiteral({ type: 'integer', default: 10 })).toBe('10');
  });

  it('returns empty object for $ref (filled at runtime via types)', () => {
    expect(schemaToEmptyLiteral({ $ref: '#/components/schemas/Foo' })).toBe('{}');
  });
});

describe('generateInitDataModuleSource', () => {
  const listOp: ParsedOperation = {
    operationId: 'pokemon_list',
    method: 'GET',
    pathTemplate: '/pokemon/',
    tags: [],
    pathParams: [],
    queryParams: [],
    bodySchema: null,
    bodySchemaName: null,
    successStatus: '200',
    responseSchema: {
      type: 'object',
      required: ['count', 'results'],
      properties: {
        count: { type: 'integer' },
        results: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
      },
    },
    responseSchemaName: 'PaginatedPokemonSummaryList',
    hasBody: true,
    operation: {},
    pathLevelSecurity: undefined,
  };

  it('emits satisfies-typed empty constants per response schema', () => {
    const source = generateInitDataModuleSource(
      [listOp],
      { schemas: {}, emitted: new Set(), lines: [] },
      './types.ts',
    );
    expect(source).toContain('import type { PokemonListData } from');
    expect(source).toContain(
      'export const emptyPaginatedPokemonSummaryList = { count: 0, results: [] } satisfies PokemonListData;',
    );
  });

  it('emits export {} when no operations have a response body', () => {
    const source = generateInitDataModuleSource(
      [{ ...listOp, hasBody: false, successStatus: '204', responseSchema: null }],
      { schemas: {}, emitted: new Set(), lines: [] },
      './types.ts',
    );
    expect(source).toContain('export {};');
    expect(source).not.toContain('satisfies');
  });
});

describe('collectReferencedInitDataSymbols', () => {
  it('collects initData symbol names from operation config', () => {
    const symbols = collectReferencedInitDataSymbols(
      [
        {
          operationId: 'pokemon_list',
        } as ParsedOperation,
      ],
      {
        pokemon_list: { initData: 'emptyPokemonListData' },
        pokemon_retrieve: { initData: false },
      },
    );
    expect([...symbols]).toEqual(['emptyPokemonListData']);
  });
});

describe('schemaToEmptyLiteral with $ref and unions', () => {
  const schemas = {
    Media: {
      type: 'object',
      properties: {
        media_url: { type: 'string' },
        media_id: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['media_url', 'media_id'],
    },
  } as Record<string, Record<string, unknown>>;

  it('follows a $ref instead of degrading to {}', () => {
    // `{}` used to be emitted here, which stops satisfying the type as soon as
    // the referenced schema has required properties.
    expect(schemaToEmptyLiteral({ $ref: '#/components/schemas/Media' }, 0, schemas)).toBe(
      "{ media_url: '', media_id: '' }",
    );
  });

  it('still degrades to {} for an unresolvable $ref', () => {
    expect(schemaToEmptyLiteral({ $ref: '#/components/schemas/Nope' }, 0, schemas)).toBe('{}');
    expect(schemaToEmptyLiteral({ $ref: '#/components/schemas/Media' })).toBe('{}');
  });

  it('emits null for a 3.1 nullable union', () => {
    expect(
      schemaToEmptyLiteral(
        { anyOf: [{ $ref: '#/components/schemas/Media' }, { type: 'null' }] },
        0,
        schemas,
      ),
    ).toBe('null');
    expect(schemaToEmptyLiteral({ oneOf: [{ type: 'string' }, { type: 'null' }] })).toBe('null');
  });

  it('falls back to the first arm of a union without null', () => {
    expect(schemaToEmptyLiteral({ anyOf: [{ type: 'string' }, { type: 'integer' }] })).toBe("''");
  });

  it('resolves a $ref nested in a required property', () => {
    const expr = schemaToEmptyLiteral(
      {
        type: 'object',
        properties: {
          avatar: { anyOf: [{ $ref: '#/components/schemas/Media' }, { type: 'null' }] },
          cover: { $ref: '#/components/schemas/Media' },
        },
        required: ['avatar', 'cover'],
      },
      0,
      schemas,
    );
    expect(expr).toBe("{ avatar: null, cover: { media_url: '', media_id: '' } }");
  });
});
