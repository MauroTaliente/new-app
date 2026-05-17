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
