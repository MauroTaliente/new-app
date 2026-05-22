import { createDataFlow } from './fetch/fetch.server';
import type { Request, RequestProps } from './types/models';
import type {
  ApiClientConfig,
  ApiClientConfigBody,
  ApiRegistryFromDefinitions,
  CreateApiRegistryOptions,
} from './types/api-registry';
import { assertValidApiName } from './types/api-registry';

export { assertValidApiName };

/** Merge `patch` into `base`; `headers` are merged key-by-key (patch wins on conflict). */
export function mergeRequestProps(base: RequestProps, patch: Partial<RequestProps>): RequestProps {
  const headers = mergeHeadersInit(base.headers, patch.headers);
  return {
    ...base,
    ...patch,
    ...(headers !== undefined ? { headers } : {}),
  };
}

function mergeHeadersInit(
  a?: RequestProps['headers'],
  b?: RequestProps['headers'],
): RequestProps['headers'] | undefined {
  if (a === undefined && b === undefined) return undefined;
  const h = new Headers(a ?? undefined);
  if (b !== undefined) {
    new Headers(b as HeadersInit).forEach((value, key) => {
      h.set(key, value);
    });
  }
  return h;
}

/** Named HTTP clients keyed by API name. Default is a wide map; pass a concrete `T` for known keys (inferred from `createApiRegistry` map form). */
export type ApiRegistry<
  T extends Record<string, Request<unknown, unknown>> = Record<string, Request<unknown, unknown>>,
> = T;

export type ApiClientConfigMap = Record<string, ApiClientConfigBody>;

function normalizeRegistryInput(
  entriesOrMap: ApiClientConfig[] | ApiClientConfigMap,
): ApiClientConfig[] {
  if (Array.isArray(entriesOrMap)) {
    return entriesOrMap;
  }
  return Object.entries(entriesOrMap).map(([name, body]) => ({
    name,
    ...body,
  })) as ApiClientConfig[];
}

/**
 * Build a map of named `createDataFlow` clients from a declarative list or from a **map** (keys = API names).
 * Use `options.load` for shared auth, or `options.loads[name]` for per-API overrides.
 * Map form preserves literal API names in the return type when the definitions object keeps literal keys (e.g. `satisfies Record<string, ApiClientConfigBody>`).
 */
export function createApiRegistry<const T extends Record<string, ApiClientConfigBody>>(
  entriesOrMap: T,
  options?: CreateApiRegistryOptions,
): ApiRegistry<ApiRegistryFromDefinitions<T>>;
export function createApiRegistry(
  entriesOrMap: ApiClientConfig[],
  options?: CreateApiRegistryOptions,
): ApiRegistry;
export function createApiRegistry<const T extends Record<string, ApiClientConfigBody>>(
  entriesOrMap: ApiClientConfig[] | T,
  options: CreateApiRegistryOptions = {},
): ApiRegistry {
  const entries = normalizeRegistryInput(entriesOrMap);
  const seen = new Set<string>();
  const registry = {} as Record<string, Request<unknown, unknown>>;

  for (const entry of entries) {
    const { name, url, ...rest } = entry;
    assertValidApiName(name);
    if (seen.has(name)) {
      throw new Error(`Duplicate api name: ${name}`);
    }
    seen.add(name);

    // Merge order: defaults < defaultsByApi[name] < per-API definition (`rest`) < per-call props (handled in `requestReady`).
    const shared: RequestProps = {
      ...options.defaults,
      ...options.defaultsByApi?.[name],
      url,
      ...rest,
    };
    const load =
      options.loads?.[name] ?? options.load ?? (async () => ({}));

    registry[name] = createDataFlow(shared, load) as Request<unknown, unknown>;
  }

  if (Array.isArray(entriesOrMap)) {
    return registry as ApiRegistry;
  }
  return registry as ApiRegistry<ApiRegistryFromDefinitions<T>>;
}
