import type { LoadRequestProps, Request, RequestProps } from './models';

/** Where the raw token string is read from (implemented in `@maurotaliente/react-persistence` or app). */
export type AuthProfileStorage = 'cookie' | 'localStorage' | 'sessionStorage';

/**
 * Serializable auth profile: storage location + header templates.
 * Values in `headers` may contain the literal `{token}` substring, replaced by the loaded token.
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

export type CreateApiRegistryOptions = {
  /** Applied to every client unless overridden in `loads`. */
  load?: LoadRequestProps;
  /** Per-client `load` (e.g. different auth per API). */
  loads?: Partial<Record<string, LoadRequestProps>>;
};

const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export function assertValidApiName(name: string): void {
  if (!NAME_RE.test(name)) {
    throw new Error(
      `Invalid api name "${name}": use a letter-first identifier [a-zA-Z][a-zA-Z0-9_]*`,
    );
  }
}
