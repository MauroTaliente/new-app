import {
  getLocalStorage,
  getSessionStorage,
  setLocalStorage,
  setSessionStorage,
} from './storage';

export type OpaqueTokenStorage = 'sessionStorage' | 'localStorage';

export type CreateOpaqueTokenPersistenceOptions = {
  /** Storage key for the opaque refresh (or similar) token string. */
  key: string;
  storage?: OpaqueTokenStorage;
};

function getStorageApi(storage: OpaqueTokenStorage) {
  return storage === 'localStorage'
    ? { get: getLocalStorage, set: setLocalStorage }
    : { get: getSessionStorage, set: setSessionStorage };
}

function removeFromStorage(key: string, storage: OpaqueTokenStorage): void {
  if (typeof window === 'undefined') return;
  const target =
    storage === 'localStorage' ? window.localStorage : window.sessionStorage;
  target.removeItem(key);
}

/**
 * Read/write/clear a single opaque string (e.g. OAuth refresh token) in
 * sessionStorage or localStorage. Values are stored as plain strings when possible.
 */
export function createOpaqueTokenPersistence(
  options: CreateOpaqueTokenPersistenceOptions,
) {
  const { key, storage = 'sessionStorage' } = options;
  const api = getStorageApi(storage);

  function read(): string | null {
    if (typeof window === 'undefined') return null;
    const v = api.get<string | undefined>({ name: key, initData: undefined });
    return typeof v === 'string' && v.length > 0 ? v : null;
  }

  function write(token: string): void {
    if (typeof window === 'undefined') return;
    api.set({ name: key, params: token });
  }

  function clear(): void {
    removeFromStorage(key, storage);
  }

  return { read, write, clear, storage, key } as const;
}
