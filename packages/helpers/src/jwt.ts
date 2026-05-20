/**
 * Client-side JWT payload helpers. Decode only — never verify signature.
 * The API is the authority; use for UI, route guards, and expiry checks.
 */

export type JwtPayload = Record<string, unknown> & {
  sub?: string;
  exp?: number;
};

/** Base64url-decode the JWT payload segment (middle part). */
export function decodeJwtPayload<T extends JwtPayload = JwtPayload>(
  token: string,
): T | null {
  try {
    const seg = token.split('.')[1];
    if (!seg) return null;
    const json = atob(seg.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** `exp` claim in seconds since epoch, or `undefined` if missing/invalid. */
export function getJwtExpiry(token: string): number | undefined {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  return typeof exp === 'number' && Number.isFinite(exp) ? exp : undefined;
}

/** True when token is missing, undecodable, or within `skewSec` of expiry. */
export function isJwtExpired(token: string | null | undefined, skewSec = 0): boolean {
  if (!token) return true;
  const exp = getJwtExpiry(token);
  if (exp === undefined) return true;
  return Date.now() / 1000 >= exp - skewSec;
}
