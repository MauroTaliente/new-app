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
};

/**
 * Contract that an app's `runtimeModule` (configured via `react33Networking.runtimeModule`
 * in `react33.config.json`) must export under the name `apiRuntime`.
 *
 * This is the **single seam** between codegen and app-level wiring (auth, session, base URL
 * overrides, retry policies). The generated `apis.generated.ts` consumes this module to wire
 * `createApiRegistry` without touching the generated file.
 *
 * Recommended pattern (file name follows the canonical suffix rule —
 * `.client` because this module re-exports the React `SessionProvider`):
 *   ```tsx
 *   // src/api/api.runtime.client.tsx
 *   'use client';
 *   import type { ApiRuntime } from '@react33/react-networking';
 *   import { createBearerSessionManager, createBearerSessionLoad } from '@react33/react-session';
 *
 *   export const session = createBearerSessionManager({ ... });
 *
 *   export const apiRuntime: ApiRuntime = {
 *     defineDefinitions: (base) => base,
 *     load: createBearerSessionLoad(session),
 *     defaults: {
 *       retries: { 401: 1 },
 *       onRetry: async ({ status }) => {
 *         if (status === 401) await session.ensureFreshSession();
 *       },
 *     },
 *   };
 *   ```
 */
export type ApiRuntime<
  T extends Record<string, ApiClientConfigBody> = Record<string, ApiClientConfigBody>,
> = {
  /** Identity transform by default; use for runtime base-URL overrides (e.g. per environment). */
  defineDefinitions: (base: T) => T;
  /** The `load` applied to every client; typically a session/auth bridge. */
  load: LoadRequestProps;
  /** Optional registry-wide defaults (retries, onRetry, timeoutMs, retryDelayMs). */
  defaults?: ApiRegistryDefaults;
};

const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export function assertValidApiName(name: string): void {
  if (!NAME_RE.test(name)) {
    throw new Error(
      `Invalid api name "${name}": use a letter-first identifier [a-zA-Z][a-zA-Z0-9_]*`,
    );
  }
}
