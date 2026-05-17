import { type DeepPartial } from 'ts-essentials';
import HttpCode from './http-status-code';

// Helpers Types — `any` only in the conditional so call signatures (Action/Setter) are preserved.
export type Expand<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { [K in keyof T]: Expand<T[K]> }
  : T;

// Request Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface SettingsProps extends RequestInit {
  method?: HttpMethod;
}

export interface RequestProps<Params = unknown> extends Omit<SettingsProps, 'body'> {
  url?: string;
  body?: Params;
}

export interface RequestReturn<Data = unknown> extends DeepPartial<Response> {
  status: HttpCode;
  data: Data;
  error?: unknown;
  errors?: unknown;
}

export type LoadRequestProps = (
  shared: RequestProps<unknown>,
) => Promise<Partial<RequestProps<unknown>>>;

export interface JoinResponsesProps<Response> extends RequestReturn<Response> {
  loading?: boolean;
}
export interface JoinResponsesReturn<Response> extends RequestReturn<Response> {
  loading: boolean;
}
export interface Request<Params, Data> {
  (props: RequestProps<Params>): Promise<RequestReturn<Data>>;
}

// Server Types
export interface DynamicCookieOptions<Data = unknown> {
  name: string;
  initData?: Data;
  params?: Data;
}

// Fetch Types
export interface Context {
  token?: string;
  recordList?: { [key: string]: StaticMeta };
}

export interface StaticOptions {
  name: string;
  url?: string;
  action?: Action;
  setter?: Setter;
  updater?: (context: Context) => void;
  state?: Context;
  method?: HttpMethod;
  onMount?: (model: unknown) => void;
  onBefore?: (model: unknown) => void;
  onFinal?: (model: unknown) => void;
  onSuccess?: (model: unknown) => void;
  onError?: (model: unknown) => void;
  fetchOnMount?: boolean;
  prevent?: boolean;
  /** Extra attempts after the first failure (network throw or retryable HTTP). Total attempts = 1 + retries. */
  retries?: number;
  /** Milliseconds to wait before each retry (after the first attempt). Ignored if retries is 0. */
  retryDelayMs?: number;
  verbose?: boolean;
  initLoading?: boolean;
  initData?: unknown;
}

export type StaticMeta = {
  triggered: number;
  success: number;
  block: number;
  error: number;
  prevented: number;
};

export type StaticMemo = {
  author: string;
  params: unknown;
  data: unknown;
  error: unknown;
  loading: boolean;
  localMeta: StaticMeta;
  initMount: boolean;
  onFinal?: (model: unknown) => void;
};

export type StaticModel = {
  author: string;
  params: unknown;
  data: unknown;
  error: unknown;
  loading: boolean;
  meta: StaticMeta;
  status: HttpCode;
};

export type Action<P = unknown, R = null> = Expand<{
  (params?: P, author?: string): Promise<RequestReturn<R>> | RequestReturn<R>;
}>;

export type Setter<P = unknown, D = unknown, R = null> = Expand<{
  (response: RequestReturn<D>, params?: P): ResponseOrData<D, R>;
}>;

export type ResponseOrData<D = unknown, R = null> = R extends object ? R : D;

export type DynamicOptions<Params = unknown, Data = unknown, Response = null> = {
  name: string;
  url?: string;
  scope?: string;
  method?: HttpMethod;
  action?: Action<Params, Data>;
  setter?: Setter<Params, Data, Response>;
  updater?: (context: Context) => void;
  state?: Context;
  onChange?: (model: DynamicModel<Params, Data, Response>) => void;
  onMount?: (model: DynamicModel<Params, Data, Response>) => void;
  onBefore?: (model: DynamicModel<Params, Data, Response>) => void;
  onFinal?: (model: DynamicModel<Params, Data, Response>) => void;
  onSuccess?: (model: DynamicModel<Params, Data, Response>) => void;
  onError?: (model: DynamicModel<Params, Data, Response>) => void;
  onUnauthorized?: (model: DynamicModel<Params, Data, Response>) => void;
  /** Run one fetch on mount using `memo.params` (after `mapWatchToParams` sync). */
  fetchOnMount?: boolean;
  /** When `watch` changes, update `memo.params` only — no network. */
  mapWatchToParams?: (watch: readonly unknown[]) => Params;
  /** After the first mount, reset `data` to `initData` when `watch` changes (no network). */
  resetDataOnWatchChange?: boolean;
  prevent?: boolean;
  retries?: number;
  retryDelayMs?: number;
  verbose?: boolean;
  initLoading?: boolean;
  initData?: ResponseOrData<Data, Response>;
  /** Opt-in: dedupe in-flight `action` by key; optional TTL for successful 2xx `RequestReturn`. Use `'global'` for the shared cache without importing it, or pass a `RequestCache` instance. */
  requestCache?: import('../cache/request-cache').RequestCacheOption;
  /** Override cache key (default: `name` + `params` + optional `scope`). */
  cacheKey?: string;
  /** `undefined`: no memory cache (still dedupes in-flight when `requestCache` is set). `> 0`: keep last success for TTL ms. */
  cacheTtlMs?: number;
};

export type SoftDynamicOptions<Params = unknown, Data = unknown, Response = null> = Partial<
  DynamicOptions<Params, Data, Response>
>;

export type DynamicModel<Params, Data, Response = null> = Expand<{
  author: string;
  loading: boolean;
  /** True while loading and no successful completion yet (same idea as `loading && meta.success === 0`). */
  initialLoading: boolean;
  /** True after at least one successful HTTP completion for this named request. */
  hasLoadedOnce: boolean;
  params?: Params;
  isRepeated: boolean;
  isFirst: boolean;
  data: ResponseOrData<Data, Response>;
  status: HttpCode;
  error: unknown;
  meta: StaticMeta;
  trigger: (
    params?: Params,
    onFinal?: ((model: DynamicModel<Params, Data, Response>) => void) | null,
    author?: string,
  ) => void;
}>;

export type DynamicMemo<Params, Data, Response = null> = {
  author: string;
  loading: boolean;
  params: Params;
  isRepeated: boolean;
  isFirst: boolean;
  data: ResponseOrData<Data, Response>;
  error: unknown;
  localMeta: StaticMeta;
  initMount: boolean;
  onFinal: (model: DynamicModel<Params, Data, Response>) => void;
};

export interface AsyncFetch<Params, Data, Response = null> {
  (
    props: DynamicOptions<Params, Data, Response>,
    watch: readonly unknown[],
  ): DynamicModel<Params, Data, Response>;
}

// Constants
export const emptyMeta: StaticMeta = {
  triggered: 0,
  success: 0,
  block: 0,
  error: 0,
  prevented: 0,
} as const;

export const runInClient = typeof document === 'undefined';
export class AsyncMeta {
  token: string;
  recordList: Record<string, unknown>;

  constructor() {
    this.token = '';
    this.recordList = {};
  }
}
