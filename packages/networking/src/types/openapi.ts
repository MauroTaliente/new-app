import type { DynamicOptions } from './models';

export type OpenApiHookOverrides<Params, Data, Response = null> = Partial<
  Pick<
    DynamicOptions<Params, Data, Response>,
    | 'fetchOnMount'
    | 'when'
    | 'verbose'
    | 'initData'
    | 'prevent'
    | 'retries'
    | 'retryDelayMs'
    | 'initLoading'
  >
>;
