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

export type { AuthProfile } from '@lib/networking';
