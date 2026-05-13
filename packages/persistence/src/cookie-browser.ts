import { mergeDeepRight, safeParse, safeStringify } from '@maurotaliente/react-helpers';
import type { DynamicCookieOptions } from '@maurotaliente/react-networking';

export type CookieWriteOptions = {
  path?: string;
  domain?: string;
  /** Max-Age in seconds */
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
};

export type CookieClientOptions<T> = DynamicCookieOptions<T> & {
  writeOptions?: CookieWriteOptions;
};

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Parse `document.cookie` (name=value pairs, first `=` only per segment). */
export function parseDocumentCookie(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader?.trim()) return out;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    out[name] = safeDecodeURIComponent(value);
  }
  return out;
}

function buildSetCookieString(name: string, value: string, write: CookieWriteOptions = {}): string {
  const segments: string[] = [];
  segments.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  if (write.path !== undefined) segments.push(`Path=${write.path}`);
  if (write.domain) segments.push(`Domain=${write.domain}`);
  if (write.maxAge !== undefined) segments.push(`Max-Age=${write.maxAge}`);
  if (write.expires) segments.push(`Expires=${write.expires.toUTCString()}`);
  if (write.secure) segments.push('Secure');
  if (write.sameSite) {
    const s = write.sameSite.charAt(0).toUpperCase() + write.sameSite.slice(1);
    segments.push(`SameSite=${s}`);
  }
  return segments.join('; ');
}

/** safeStringify writes strings without JSON quotes; when JSON.parse fails, treat raw as plain string. */
function parsePlainString<T>(raw: string, initData: T | undefined): T | undefined {
  if (typeof initData !== 'string' || !raw.length) return undefined;
  try {
    JSON.parse(raw);
    return undefined;
  } catch {
    if (/^[a-zA-Z0-9_-]+$/.test(raw)) return raw as T;
    return undefined;
  }
}

export function getCookie<T>(options: CookieClientOptions<T>): T | undefined {
  const { name, initData } = options;
  if (!name || typeof document === 'undefined') return initData as T | undefined;
  const cookies = parseDocumentCookie(document.cookie || '');
  const raw = cookies[name];
  if (raw === undefined) return initData as T | undefined;
  const rawData = safeParse<T>(raw, null);
  if (rawData === null) {
    const plain = parsePlainString(raw, initData);
    if (plain !== undefined) return plain;
    return initData as T | undefined;
  }
  if (
    initData !== undefined &&
    typeof initData === 'object' &&
    initData !== null &&
    typeof rawData === 'object' &&
    rawData !== null &&
    !Array.isArray(rawData)
  ) {
    return mergeDeepRight(initData as object, rawData as object) as T;
  }
  return rawData as T;
}

export function setCookie<T>(options: CookieClientOptions<T>): T | undefined {
  const { name, params, writeOptions } = options;
  if (!name || typeof document === 'undefined') return params as T | undefined;
  const payload = safeStringify(params, 0, '');
  document.cookie = buildSetCookieString(name, payload, writeOptions);
  return params as T | undefined;
}

export function putCookie<T>(options: CookieClientOptions<T>): T | undefined {
  const { name, params, initData, writeOptions } = options;
  if (!name || typeof document === 'undefined') return params as T | undefined;
  const existing = getCookie<T>({ name, initData });
  let next: T | undefined;
  if (
    existing !== undefined &&
    typeof existing === 'object' &&
    existing !== null &&
    params !== undefined &&
    typeof params === 'object' &&
    params !== null
  ) {
    next = mergeDeepRight(existing as object, params as object) as T;
  } else {
    next = params as T;
  }
  const payload = safeStringify(next, 0, '');
  document.cookie = buildSetCookieString(name, payload, writeOptions);
  return next;
}
