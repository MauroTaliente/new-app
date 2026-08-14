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

// 0.0.11 — `when` must be reachable from the CODEGEN surface, not only the
// direct API. `OpenApiHookOverrides` is an explicit Pick, so adding an option
// to DynamicOptions does NOT expose it to generated hooks by itself — this
// type-level assertion pins the seam (architecture principle 10).
describe('OpenApiHookOverrides', () => {
  it('accepts the `when` declarative gate', () => {
    expectTypeOf({} as OpenApiHookOverrides<undefined, { ok: boolean }>).toHaveProperty('when');
  });
});
