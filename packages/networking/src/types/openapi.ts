import type { DynamicOptions } from './models';

export type OpenApiHookOverrides<Params, Data, Response = null> = Partial<
  Pick<
    DynamicOptions<Params, Data, Response>,
    | 'fetchOnMount'
    | 'verbose'
    | 'initData'
    | 'prevent'
    | 'retries'
    | 'retryDelayMs'
    | 'initLoading'
    | 'mapWatchToParams'
    | 'resetDataOnWatchChange'
  >
>;
