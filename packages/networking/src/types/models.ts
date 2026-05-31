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

/**
 * Retry budget. Two shapes:
 * - `number`: extra attempts after first failure, using the default policy (5xx, 408, 429, plus throws/aborts as status `0`). Backward-compatible with the historical `retries: number` field.
 * - `Partial<Record<HttpCode, number>>`: exhaustive per-status budgets. A status not listed gets `0` retries. Cover network throws/aborts via the `0` key.
 */
export type RetryBudget = number | Partial<Record<HttpCode, number>>;

export interface RequestReturn<Data = unknown> extends DeepPartial<Response> {
  status: HttpCode;
  data: Data;
  error?: unknown;
  errors?: unknown;
}

/**
 * Context passed to `onRetry` between attempts (awaited).
 *
 * `response` and `error` are **mutually exclusive**:
 *   - When `status > 0`, the attempt produced a response — `response` is set, `error` is absent.
 *   - When `status === 0`, the attempt threw or was aborted — `error` is set, `response` is absent.
 *
 * Use `response.headers`, `response.data`, or `response.error` to inspect the failed attempt
 * (e.g. parse `Retry-After`, branch on a body-level error code, log a correlation id).
 */
export type RetryContext<Data = unknown> = {
  /** Status of the attempt that just failed. `0` means thrown/aborted (no response). */
  status: HttpCode;
  /** Zero-based index of the attempt that just failed. The next attempt will be `attempt + 1`. */
  attempt: number;
  /** Full response, when the attempt produced one (`status > 0`). Absent on throws/aborts. */
  response?: RequestReturn<Data>;
  /** Original thrown error, when the attempt threw (`status === 0`). Absent when a response was received. */
  error?: unknown;
  /**
   * Mirrors {@link RequestProps.skipLoad} of the request being retried. When `true` the request
   * deliberately bypassed the registry `load`, so it carries none of the shared per-call
   * augmentation (auth headers, etc.). A retry policy that would re-authenticate and replay
   * (e.g. the session 401→refresh bridge) should treat such a request as terminal — replaying
   * it would just re-send the same un-augmented request. See {@link RequestProps.skipLoad}.
   */
  skipLoad?: boolean;
};

/** Called between retry attempts. Awaited — use to refresh tokens, parse `Retry-After`, log, etc. */
export type OnRetry<Data = unknown> = (ctx: RetryContext<Data>) => Promise<void> | void;

export interface RequestProps<Params = unknown> extends Omit<SettingsProps, 'body'> {
  url?: string;
  body?: Params;
  /**
   * Retry budget. See {@link RetryBudget}. Honored by `createDataFlow` (server route loaders, registries) and by `useAsyncFetch`.
   * Default (undefined): no retries.
   */
  retries?: RetryBudget;
  /** Milliseconds to wait between attempts (after each failure). Ignored when no retries happen. */
  retryDelayMs?: number;
  /**
   * Awaited hook fired between attempts with the full `RetryContext`. Use to inspect the failed
   * response (headers, body), refresh tokens, parse `Retry-After`, or report telemetry. The
   * `response` field carries the full `RequestReturn` of the failed attempt — type it via
   * `RetryContext<MyData>` in your handler if you need typed access to `response.data`.
   */
  onRetry?: OnRetry;
  /**
   * Abort each attempt after this many milliseconds (per-attempt, not total). Aborted attempts produce `status: 0`,
   * which is retriable in number-form retries by default. Combine with `retries` to get bounded total time.
   */
  timeoutMs?: number;
  /**
   * Bypass the registry `load` for this call. When `true`, `createDataFlow` skips `load(shared)`
   * entirely — the request is sent with no per-call augmentation (no auth headers, no proactive
   * token refresh).
   *
   * Default (undefined): the `load` runs as usual.
   *
   * The motivating case is an **auth-refresh endpoint**: the refresh request is itself issued
   * from inside the `load`'s refresh path, so routing it back through the same `load` deadlocks
   * (the request awaits the very refresh that is awaiting it). Marking the refresh call
   * `skipLoad` breaks that cycle. The OpenAPI codegen sets it automatically for operations the
   * spec declares public (`security: []`). Also surfaced on {@link RetryContext.skipLoad} so
   * retry policies can recognise an un-augmented request.
   */
  skipLoad?: boolean;
}

/**
 * Per-request "load" hook: receives the shared `RequestProps` for the client and returns a
 * partial override applied before each attempt (see `createDataFlow`).
 *
 * **Merge semantics** — the returned partial is spread on top of `shared` shallowly:
 * `{ ...shared, ...loaded, ...perCall }`. That means **`headers` is replaced wholesale**,
 * not key-by-key. If you only want to add an `Authorization` header without dropping the
 * shared `Accept` (or any header set per-API), pre-merge with `mergeRequestProps`:
 *
 * ```ts
 * import { mergeRequestProps } from '@react33/react-networking';
 *
 * const load: LoadRequestProps = async (shared) => {
 *   const token = await getToken();
 *   return mergeRequestProps(shared, { headers: { Authorization: `Bearer ${token}` } });
 * };
 * ```
 *
 * The bridge in `@react33/react-session` (`createBearerSessionLoad`) does this internally,
 * so consumers of that bridge don't need to handle it.
 *
 * The load is re-invoked **before each retry attempt** — a refreshed token from a previous
 * attempt's `onRetry` (e.g. `session.ensureFreshSession()`) automatically reaches the next
 * attempt without manual plumbing.
 */
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
  /** Retry budget. See {@link RetryBudget}. Backward-compatible with `retries: number`. */
  retries?: RetryBudget;
  /** Milliseconds to wait before each retry (after the first attempt). Ignored if retries is 0. */
  retryDelayMs?: number;
  /** Awaited hook fired between attempts with the full retry context (status, attempt, response?, error?). */
  onRetry?: OnRetry;
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
  /** Run one fetch on mount using current `memo.params` (from a prior `trigger` or `undefined`). */
  fetchOnMount?: boolean;
  prevent?: boolean;
  /** Retry budget. See {@link RetryBudget}. Backward-compatible with `retries: number`. */
  retries?: RetryBudget;
  retryDelayMs?: number;
  /**
   * Awaited callback fired between attempts. Receives a {@link DynamicRetryModel} —
   * the hook's `common` model extended with `attempt` and `response?`. Keeps the convention
   * of other hook callbacks (`onSuccess`, `onError`, `onUnauthorized`) which also receive the model.
   */
  onRetry?: (model: DynamicRetryModel<Params, Data, Response>) => Promise<void> | void;
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

/**
 * Model passed to `useAsyncFetch`'s `onRetry` between attempts.
 *
 * Extends {@link DynamicModel} with retry-specific fields:
 *   - `attempt`: zero-based index of the attempt that just failed.
 *   - `response?`: full `RequestReturn<Data>` when the attempt produced one
 *     (absent on throws/aborts — see {@link RetryContext}).
 *
 * `status` and `error` inherit from `DynamicModel` but are **overridden in the call** to reflect
 * the just-failed attempt (rather than the React state at the time of the closure).
 */
export type DynamicRetryModel<Params, Data, Response = null> =
  DynamicModel<Params, Data, Response> & {
    attempt: number;
    response?: RequestReturn<Data>;
  };

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
  (props: DynamicOptions<Params, Data, Response>): DynamicModel<Params, Data, Response>;
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
