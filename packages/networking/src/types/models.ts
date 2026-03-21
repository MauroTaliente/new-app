import { type DeepPartial } from 'ts-essentials';
import HttpCode from './http-status-code';

// Helpers Types
export type Expand<T> = T extends (...args: any) => any
  ? T
  : T extends object
  ? { [K in keyof T]: Expand<T[K]> }
  : T;

// Request Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface SettingsProps extends RequestInit {
  method?: HttpMethod;
}

export interface RequestProps<Params = any> extends Omit<SettingsProps, 'body'> {
  url?: string;
  body?: Params;
}

export interface RequestReturn<Data = any> extends DeepPartial<Response> {
  status: HttpCode;
  data: Data;
  error?: any;
  errors?: any;
}

export type LoadRequestProps = (shared: RequestProps<any>) => Promise<Partial<RequestProps<any>>>;

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
export interface DynamicCookieOptions<Data = any> {
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
  onMount?: (model: any) => void;
  onBefore?: (model: any) => void;
  onFinal?: (model: any) => void;
  onSuccess?: (model: any) => void;
  onError?: (model: any) => void;
  params?: any;
  auto?: boolean;
  prevent?: boolean;
  /** Extra attempts after the first failure (network throw or retryable HTTP). Total attempts = 1 + retries. */
  retries?: number;
  /** Milliseconds to wait before each retry (after the first attempt). Ignored if retries is 0. */
  retryDelayMs?: number;
  verbose?: boolean;
  initLoading?: boolean;
  initData?: any;
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
  params: any;
  data: any;
  error: any;
  loading: boolean;
  localMeta: StaticMeta;
  initMount: boolean;
  onFinal?: (model: any) => void;
};

export type StaticModel = {
  author: string;
  params: any;
  data: any;
  error: any;
  loading: boolean;
  meta: StaticMeta;
  status: HttpCode;
};

export type Action<P = any, R = null> = Expand<{
  (params?: P, author?: string): Promise<RequestReturn<R>> | RequestReturn<R>;
}>;

export type Setter<P = any, D = any, R = null> = Expand<{
  (response: RequestReturn<D>, params?: P): ResponseOrData<D, R>;
}>;

export type ResponseOrData<D = any, R = null> = R extends object ? R : D;

export type DynamicOptions<Params = any, Data = any, Response = null> = {
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
  params?: Params;
  auto?: boolean;
  prevent?: boolean;
  retries?: number;
  retryDelayMs?: number;
  verbose?: boolean;
  initLoading?: boolean;
  initData?: ResponseOrData<Data, Response>;
};

export type SoftDynamicOptions<Params = any, Data = any, Response = null> = Partial<
  DynamicOptions<Params, Data, Response>
>;

export type DynamicModel<Params, Data, Response = null> = Expand<{
  author: string;
  loading: boolean;
  /** True while loading and no successful completion yet (same idea as `loading && meta.success === 0`). */
  initialLoading: boolean;
  /** True after at least one successful HTTP completion for this named request. */
  hasLoadedOnce: boolean;
  params: Params;
  isRepeated: boolean;
  isFirst: boolean;
  data: ResponseOrData<Data, Response>;
  status: HttpCode;
  error: any;
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
  error: any;
  localMeta: StaticMeta;
  initMount: boolean;
  onFinal: (model: DynamicModel<Params, Data, Response>) => void;
};

export interface AsyncFetch<Params, Data, Response = null> {
  (
    props: DynamicOptions<Params, Data, Response>,
    watch: any[],
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
  recordList: Record<string, any>;

  constructor() {
    this.token = '';
    this.recordList = {};
  }
}
