import type { LoadRequestProps, Request, RequestProps } from './models';

/** Where the raw token string is read from (implemented in `@react33/react-persistence` or app). */
export type AuthProfileStorage = 'cookie' | 'localStorage' | 'sessionStorage';

/**
 * Serializable auth profile: storage location + header templates.
 * Values in `headers` may contain the literal `{token}` substring, replaced by the loaded token.
 *
 * Defined here (in the networking primitive) because the load contract it produces
 * (`LoadRequestProps`) is owned by networking. **Consumed by** `@react33/react-persistence`
 * via `createLoadRequestPropsFromAuthProfile` — that's the side that reads the raw token from
 * cookie / localStorage / sessionStorage and renders the templated headers.
 *
 * @see {@link LoadRequestProps} for the load contract.
 * @see `createLoadRequestPropsFromAuthProfile` in `@react33/react-persistence`.
 */
export type AuthProfile = {
  storage: AuthProfileStorage;
  /** Cookie name or local/session storage key */
  key: string;
  /** e.g. `{ Authorization: 'Bearer {token}' }` or `{ 'X-Api-Key': '{token}' }` */
  headers: Record<string, string>;
};

/** One logical HTTP client: unique `name` and shared `RequestProps` (without `body`). */
export type ApiClientConfig = { name: string; url: string } & Omit<RequestProps, 'url' | 'body'>;

/** Same as `ApiClientConfig` but without `name` — use with `createApiRegistry` map form (object keys are names). */
export type ApiClientConfigBody = Omit<ApiClientConfig, 'name'>;

/**
 * Map from API name keys in a definitions object to `Request` clients.
 * Use with `createApiRegistry(definitions)` when `definitions` preserves literal keys (e.g. `satisfies Record<string, ApiClientConfigBody>`).
 */
export type ApiRegistryFromDefinitions<T extends Record<string, ApiClientConfigBody>> = {
  [K in keyof T]: Request<unknown, unknown>;
};

/**
 * Subset of `RequestProps` accepted as registry-wide defaults.
 *
 * **Merge order (lowest to highest priority)**:
 *   1. `ApiRegistryDefaults` (this type) — registry-wide, passed to `createApiRegistry`.
 *   2. Per-API definition props — declared in the entries map (`{ foo: { retries: 0, ... } }`).
 *   3. Per-call props — passed to `apis.foo(props)` at call site.
 *
 * The later value wins on each field. Use this for **global** policies (e.g. retry-on-401),
 * per-API definitions for **endpoint-specific** overrides, and per-call props for
 * **one-shot** customization.
 */
export type ApiRegistryDefaults = Pick<
  RequestProps,
  'retries' | 'retryDelayMs' | 'onRetry' | 'timeoutMs'
>;

export type CreateApiRegistryOptions = {
  /** Applied to every client unless overridden in `loads`. */
  load?: LoadRequestProps;
  /** Per-client `load` (e.g. different auth per API). */
  loads?: Partial<Record<string, LoadRequestProps>>;
  /**
   * Registry-wide defaults applied to every client. Per-API definitions in the entries map
   * override these; per-call props (passed when calling `apis.foo(props)`) override both.
   *
   * Useful for global retry/timeout/onRetry policies — e.g. `{ retries: { 401: 1 }, onRetry: ... }`
   * applies to all generated clients without touching per-API definitions or each call site.
   */
  defaults?: ApiRegistryDefaults;
  /**
   * Per-client defaults keyed by API name — the per-API counterpart of `defaults`, the same way
   * `loads` is the per-API counterpart of `load`.
   *
   * **Merge order (lowest to highest priority)**:
   *   1. `defaults` — registry-wide.
   *   2. `defaultsByApi[name]` — this map, for one API.
   *   3. Per-API definition props — declared in the entries map.
   *   4. Per-call props.
   *
   * Needed when a retry/`onRetry` policy is **session-specific**: with multiple sessions, a 401
   * from API `billing` must refresh the `billing` session's token, not another's — so `onRetry`
   * cannot be a single registry-wide closure. An API with no entry here falls back to `defaults`.
   */
  defaultsByApi?: Partial<Record<string, ApiRegistryDefaults>>;
};

/**
 * Contract that an app's `runtimeModule` (configured via `react33Networking.runtimeModule`
 * in `react33.config.json`) must export under the name `apiRuntime`.
 *
 * This is the **single seam** between codegen and app-level wiring (auth, session, base URL
 * overrides, retry policies). The generated `apis.generated.ts` consumes this module to wire
 * `createApiRegistry` without touching the generated file.
 *
 * For a single-session app the seam exposes one `load`; for a multi-session app (several APIs,
 * each with its own token/auth) it exposes `loads` keyed by API name plus `defaultsByApi` for
 * per-API, session-specific retry policy. Both shapes are typically **generated** by the
 * `@react33/react-session` codegen into a `session.runtime.generated.ts` module — see that
 * package's README. All fields are optional: an unauthenticated registry needs none of them.
 *
 *   ```ts
 *   // session.runtime.generated.ts (generated — framework-agnostic, server-safe)
 *   export const apiRuntime: ApiRuntime = {
 *     loads: { pokemon: mainLoad, billing: partnerLoad },
 *     defaultsByApi: { billing: createBearerSessionRetry(partnerSession) },
 *   };
 *   ```
 */
export type ApiRuntime<
  T extends Record<string, ApiClientConfigBody> = Record<string, ApiClientConfigBody>,
> = {
  /** Optional base-definitions transform — use for runtime base-URL overrides (e.g. per environment). Defaults to identity. */
  defineDefinitions?: (base: T) => T;
  /** A `load` applied to every client unless overridden in `loads`; typically a session/auth bridge. */
  load?: LoadRequestProps;
  /** Per-API `load` keyed by API name — different auth/token per API (multi-session). */
  loads?: Partial<Record<string, LoadRequestProps>>;
  /** Optional registry-wide defaults (retries, onRetry, timeoutMs, retryDelayMs). */
  defaults?: ApiRegistryDefaults;
  /** Per-API defaults keyed by API name — session-specific retry/`onRetry` policy. */
  defaultsByApi?: Partial<Record<string, ApiRegistryDefaults>>;
};

const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export function assertValidApiName(name: string): void {
  if (!NAME_RE.test(name)) {
    throw new Error(
      `Invalid api name "${name}": use a letter-first identifier [a-zA-Z][a-zA-Z0-9_]*`,
    );
  }
}
