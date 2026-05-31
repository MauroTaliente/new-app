export {
  readClientEnv,
  resolvePersistenceMode,
  type PersistenceMode,
  type ResolvePersistenceModeOptions,
} from './persistence-mode.js';

export {
  createStorageApi,
  getLocalStorage,
  setLocalStorage,
  putLocalStorage,
  getSessionStorage,
  setSessionStorage,
  putSessionStorage,
  type StorageDriverOptions,
} from './storage';

export {
  createOpaqueTokenPersistence,
  type CreateOpaqueTokenPersistenceOptions,
  type OpaqueTokenStorage,
} from './opaque-token-persistence';

export {
  createVersionedStorageApi,
  type VersionedEnvelope,
  type VersionedStorageOptions,
} from './versioned-storage';

export { subscribeStorageKey } from './storage-events';

export {
  createPersistedSignal,
  type PersistedSignal,
  type PersistedSignalOptions,
} from './persisted-signal.client';

export {
  parseDocumentCookie,
  getCookie,
  setCookie,
  putCookie,
  type CookieWriteOptions,
  type CookieClientOptions,
} from './cookie-browser';

export {
  getCookieFromStore,
  setCookieInStore,
  putCookieInStore,
  type CookieStoreLike,
  type ServerCookieOptions,
} from './cookie-store';

export { useGetLocal, useSetLocal, usePutLocal } from './local-storage.client';
export { useGetSession, useSetSession, usePutSession } from './session-storage.client';
export { useGetCookie, useSetCookie, usePutCookie } from './cookies.client';

export {
  createLoadRequestPropsFromAuthProfile,
  createLoadRequestPropsFromAuthProfiles,
} from './http-auth-load';

export type { AuthProfile } from '@react33/react-networking';
