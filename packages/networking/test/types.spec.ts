import { describe, it, expectTypeOf } from 'vitest';
import type { DynamicModel, DynamicOptions } from '../src/types/models.js';
import type { OpenApiHookOverrides } from '../src/types/openapi.js';

describe('DynamicModel typing', () => {
  it('includes loader helpers', () => {
    expectTypeOf({} as DynamicModel<unknown, unknown>).toHaveProperty('initialLoading');
    expectTypeOf({} as DynamicModel<unknown, unknown>).toHaveProperty('hasLoadedOnce');
  });

  it('DynamicOptions accepts retryDelayMs', () => {
    const o: DynamicOptions = {
      name: 'x',
      retryDelayMs: 100,
      retries: 1,
    };
    expectTypeOf(o.retryDelayMs).toEqualTypeOf<number | undefined>();
  });

  it('OpenApiHookOverrides picks hook-safe keys', () => {
    const o: OpenApiHookOverrides<{ id: string }, { ok: boolean }> = {
      fetchOnMount: true,
      verbose: false,
    };
    expectTypeOf(o.fetchOnMount).toEqualTypeOf<boolean | undefined>();
  });
});
