import type { AuthProfile, LoadRequestProps, RequestProps } from '@react33/react-networking';
import { mergeRequestProps } from '@react33/react-networking';
import { parseDocumentCookie } from './cookie-browser';
import { getLocalStorage, getSessionStorage } from './storage';

function applyTokenToHeaders(
  token: string,
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, value.replaceAll('{token}', token)]),
  );
}

async function readRawToken(profile: AuthProfile): Promise<string | undefined> {
  if (profile.storage === 'cookie') {
    if (typeof document === 'undefined') return undefined;
    const cookies = parseDocumentCookie(document.cookie || '');
    const raw = cookies[profile.key];
    return raw !== undefined && raw.length > 0 ? raw : undefined;
  }

  if (profile.storage === 'localStorage') {
    const v = getLocalStorage<string>({ name: profile.key, initData: undefined });
    if (typeof v === 'string' && v.length > 0) return v;
    return undefined;
  }

  if (profile.storage === 'sessionStorage') {
    const v = getSessionStorage<string>({ name: profile.key, initData: undefined });
    if (typeof v === 'string' && v.length > 0) return v;
    return undefined;
  }

  return undefined;
}

/**
 * Builds a `LoadRequestProps` that reads a token from cookie or storage and merges headers from `AuthProfile.headers` (`{token}` replaced).
 */
export function createLoadRequestPropsFromAuthProfile(profile: AuthProfile): LoadRequestProps {
  return async (shared: RequestProps) => {
    const token = await readRawToken(profile);
    if (!token) {
      return shared;
    }
    const extraHeaders = applyTokenToHeaders(token, profile.headers);
    return mergeRequestProps(shared, { headers: extraHeaders });
  };
}

/**
 * Map named auth profiles to per-API loaders for `createApiRegistry(..., { loads })`.
 */
export function createLoadRequestPropsFromAuthProfiles(
  profiles: Record<string, AuthProfile>,
): Record<string, LoadRequestProps> {
  const out: Record<string, LoadRequestProps> = {};
  for (const [name, profile] of Object.entries(profiles)) {
    out[name] = createLoadRequestPropsFromAuthProfile(profile);
  }
  return out;
}
