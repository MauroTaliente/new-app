import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import {
  OpenApiValidationError,
  resolveOpenApiValidateConfig,
  resolveOpenApiSdkValidate,
  validateOpenApiParams,
  validateOpenApiResponse,
} from '../src/openapi/validation.js';
import HttpCode from '../src/types/http-status-code.js';

describe('resolveOpenApiValidateConfig', () => {
  it('merges defaults → file → operation', () => {
    expect(
      resolveOpenApiValidateConfig(
        false,
        { params: true, response: false },
        { response: true, mode: 'strict' },
      ),
    ).toEqual({ params: true, response: true, mode: 'strict' });
  });

  it('operation false disables validation', () => {
    expect(resolveOpenApiValidateConfig(true, true, false)).toEqual({
      params: false,
      response: false,
      mode: 'log',
    });
  });
});

describe('validateOpenApiParams', () => {
  it('returns parsed data on success', () => {
    const schema = z.object({ id: z.string() });
    const out = validateOpenApiParams(schema, { id: '1' }, {
      operationId: 'test',
      schemaName: 'TestSchema',
      direction: 'params',
      mode: 'log',
    });
    expect(out).toEqual({ id: '1' });
  });

  it('throws in strict mode on failure', () => {
    const schema = z.object({ count: z.number() });
    expect(() =>
      validateOpenApiParams(schema, { count: 'nope' } as unknown as { count: number }, {
        operationId: 'test',
        schemaName: 'TestSchema',
        direction: 'params',
        mode: 'strict',
      }),
    ).toThrow(OpenApiValidationError);
  });

  it('logs and returns raw value in log mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const schema = z.object({ n: z.number() });
    const raw = { n: 'bad' } as unknown as { n: number };
    const out = validateOpenApiParams(schema, raw, {
      operationId: 'test',
      schemaName: 'TestSchema',
      direction: 'params',
      mode: 'log',
    });
    expect(out).toBe(raw);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('logs success when verbose is true', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const schema = z.object({ id: z.string() });
    validateOpenApiParams(schema, { id: '1' }, {
      operationId: 'pokemon_list',
      schemaName: 'PokemonListParamsSchema',
      direction: 'params',
      mode: 'log',
      verbose: true,
    });
    expect(log).toHaveBeenCalledWith('✅ pokemon_list: params validated\n');
    log.mockRestore();
  });
});

describe('validateOpenApiResponse', () => {
  it('parses response data when valid', () => {
    const schema = z.object({ ok: z.boolean() });
    const res = validateOpenApiResponse(
      schema,
      { status: HttpCode.OK, data: { ok: true } },
      {
        operationId: 'test',
        schemaName: 'TestDataSchema',
        direction: 'response',
        mode: 'log',
      },
    );
    expect(res.data).toEqual({ ok: true });
  });

  it('throws in strict mode when response data is invalid', () => {
    const schema = z.object({ count: z.number() });
    expect(() =>
      validateOpenApiResponse(
        schema,
        { status: HttpCode.OK, data: { count: 'nope' } },
        {
          operationId: 'pokemon_list',
          schemaName: 'PokemonListDataSchema',
          direction: 'response',
          mode: 'strict',
        },
      ),
    ).toThrow(OpenApiValidationError);
  });

  it('returns raw data in log mode when response is invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const schema = z.object({ count: z.number() });
    const raw = { count: 'bad' } as unknown as { count: number };
    const res = validateOpenApiResponse(
      schema,
      { status: HttpCode.OK, data: raw },
      {
        operationId: 'pokemon_list',
        schemaName: 'PokemonListDataSchema',
        direction: 'response',
        mode: 'log',
      },
    );
    expect(res.data).toBe(raw);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('logs response success when verbose is true', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const schema = z.object({ ok: z.boolean() });
    validateOpenApiResponse(
      schema,
      { status: HttpCode.OK, data: { ok: true } },
      {
        operationId: 'pokemon_list',
        schemaName: 'PokemonListDataSchema',
        direction: 'response',
        mode: 'log',
        verbose: true,
      },
    );
    expect(log).toHaveBeenCalledWith('🛡️ pokemon_list: response validated\n');
    log.mockRestore();
  });
});

describe('resolveOpenApiSdkValidate', () => {
  it('call override can disable validation', () => {
    expect(
      resolveOpenApiSdkValidate(
        { params: true, response: true, mode: 'log' },
        false,
      ),
    ).toEqual({ params: false, response: false, mode: 'log' });
  });
});
