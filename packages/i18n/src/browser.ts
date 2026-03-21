import { parseDocumentCookie } from '@lib/persistence';

export type ResolveInitialLocaleOptions = {
  /** Fallback when nothing else matches. */
  defaultLocale: string;
  /** Allowed locale codes (e.g. `es`, `en`). */
  allowedLocales: readonly string[];
  /** Cookie name (uses `cookieHeader` or `document.cookie`). */
  cookieName?: string;
  localStorageKey?: string;
  /** Pathname to parse (e.g. `/es/dashboard`). First segment used if no `urlLocalePattern`. */
  pathname?: string;
  /** If set, first capture group must be the locale code. */
  urlLocalePattern?: RegExp;
  /** Raw Cookie header (tests / SSR cookie string). Defaults to `document.cookie` in browser. */
  cookieHeader?: string;
  /** Override `navigator.language` (useful in tests). */
  navigatorLanguage?: string;
};

/**
 * Normalize `es-AR` → `es` when `es` is in `allowedLocales`.
 */
export function normalizeLocaleTag(raw: string | undefined, allowedLocales: readonly string[]): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (allowedLocales.includes(trimmed)) return trimmed;
  const short = trimmed.split(/[-_]/)[0]?.toLowerCase();
  if (short && allowedLocales.includes(short)) return short;
  return undefined;
}

/**
 * Resolve active locale without Next: URL → cookie → localStorage → navigator → default.
 */
export function resolveInitialLocale(options: ResolveInitialLocaleOptions): string {
  const {
    defaultLocale,
    allowedLocales,
    pathname,
    urlLocalePattern,
    cookieName,
    localStorageKey,
    cookieHeader,
    navigatorLanguage,
  } = options;

  const norm = (s: string | undefined) => normalizeLocaleTag(s, allowedLocales);

  if (pathname) {
    if (urlLocalePattern) {
      const m = pathname.match(urlLocalePattern);
      if (m?.[1]) {
        const n = norm(m[1]);
        if (n) return n;
      }
    } else {
      const seg = pathname.split('/').filter(Boolean)[0];
      const n = norm(seg);
      if (n) return n;
    }
  }

  if (cookieName) {
    const header =
      cookieHeader !== undefined
        ? cookieHeader
        : typeof document !== 'undefined'
          ? document.cookie
          : '';
    const parsed = parseDocumentCookie(header);
    const n = norm(parsed[cookieName]);
    if (n) return n;
  }

  if (localStorageKey && typeof localStorage !== 'undefined') {
    try {
      const n = norm(localStorage.getItem(localStorageKey) ?? undefined);
      if (n) return n;
    } catch {
      /* private mode / blocked */
    }
  }

  const nav =
    navigatorLanguage !== undefined
      ? navigatorLanguage
      : typeof navigator !== 'undefined'
        ? navigator.language
        : undefined;
  const n = norm(nav);
  if (n) return n;

  return defaultLocale;
}
