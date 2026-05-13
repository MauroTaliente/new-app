import { cookies } from 'next/headers';
import type { DynamicCookieOptions } from '@react33/react-networking';
import {
  getCookieFromStore,
  putCookieInStore,
  setCookieInStore,
  type CookieStoreLike,
  type ServerCookieOptions,
} from './cookie-store';

export async function getCookie<T>(options: DynamicCookieOptions<T>): Promise<T> {
  const store = (await cookies()) as unknown as CookieStoreLike;
  return getCookieFromStore(store, options);
}

export async function setCookie<T>(options: ServerCookieOptions<T>): Promise<T> {
  const store = (await cookies()) as unknown as CookieStoreLike;
  return setCookieInStore(store, options);
}

export async function putCookie<T>(options: ServerCookieOptions<T>): Promise<T> {
  const store = (await cookies()) as unknown as CookieStoreLike;
  return putCookieInStore(store, options);
}
