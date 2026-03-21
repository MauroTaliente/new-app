import { describe, it, expectTypeOf } from 'vitest';
import type { DynamicModel, DynamicOptions } from '../src/types/models.js';

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
});
