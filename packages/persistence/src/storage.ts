import { mergeDeepRight, safeParse, safeStringify } from '@lib/helpers';

/** Loose shape so callers can pass `DynamicOptions` without Params/Data mismatch. */
export type StorageDriverOptions<T = unknown> = {
  name: string;
  initData?: T;
  params?: unknown;
};

function assertName(name: string | undefined): name is string {
  return typeof name === 'string' && name.length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Round-trip with `safeParse` / JSON.parse. `safeStringify` returned raw strings (not valid JSON). */
function serializeStorageValue(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return safeStringify(value, 0, '{}');
  }
}

/**
 * Legacy: values written with `safeStringify` for string params were stored without JSON quotes
 * (e.g. `light` instead of `"light"`), so JSON.parse failed and reads fell back to initData.
 */
function tryLegacyPlainString<T>(raw: string, initData: T | undefined): T | undefined {
  if (typeof initData !== 'string' || !raw.length) return undefined;
  try {
    JSON.parse(raw);
    return undefined;
  } catch {
    if (/^[a-zA-Z0-9_-]+$/.test(raw)) return raw as T;
    return undefined;
  }
}

export function createStorageApi(storage: Storage) {
  function getLocal<T>({ name, initData }: StorageDriverOptions<T>): T {
    if (!assertName(name) || typeof window === 'undefined') return initData as T;
    const raw = storage.getItem(name);
    if (raw === null || raw === '') return initData as T;
    const parsed = safeParse<unknown>(raw, null);
    if (parsed === null) {
      const legacy = tryLegacyPlainString(raw, initData);
      if (legacy !== undefined) return legacy;
      return initData as T;
    }
    if (isPlainObject(initData) && isPlainObject(parsed)) {
      return mergeDeepRight(initData, parsed) as T;
    }
    return parsed as T;
  }

  function setLocal<T>({ name, params }: StorageDriverOptions<T>): T {
    if (!assertName(name) || typeof window === 'undefined') return params as T;
    storage.setItem(name, serializeStorageValue(params));
    return params as T;
  }

  function putLocal<T>({ name, initData, params }: StorageDriverOptions<T>): T {
    if (!assertName(name) || typeof window === 'undefined') return params as T;
    const raw = storage.getItem(name);
    const parsed = safeParse<unknown>(raw == null ? '{}' : raw, {});
    if (isPlainObject(initData) && isPlainObject(parsed)) {
      const data = mergeDeepRight(initData, parsed);
      const sendData = mergeDeepRight(data, params as object);
      storage.setItem(name, serializeStorageValue(sendData));
      return sendData as T;
    }
    storage.setItem(name, serializeStorageValue(params));
    return params as T;
  }

  return { getLocal, setLocal, putLocal };
}

const local = createStorageApi(
  typeof window !== 'undefined' ? window.localStorage : ({} as Storage),
);

const session = createStorageApi(
  typeof window !== 'undefined' ? window.sessionStorage : ({} as Storage),
);

export const getLocalStorage = local.getLocal;
export const setLocalStorage = local.setLocal;
export const putLocalStorage = local.putLocal;

export const getSessionStorage = session.getLocal;
export const setSessionStorage = session.setLocal;
export const putSessionStorage = session.putLocal;
