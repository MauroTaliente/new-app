import { mergeDeepRight, safeParse, safeStringify } from '@maurotaliente/react-helpers';
import type { StorageDriverOptions } from './storage';

function assertName(name: string | undefined): name is string {
  return typeof name === 'string' && name.length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function serializeStorageValue(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return safeStringify(value, 0, '{}');
  }
}

/** On-disk shape for versioned keys: `{ _v, data }`, optional `savedAt` for TTL. */
export type VersionedEnvelope<T = unknown> = {
  _v: number;
  data: T;
  /** Epoch ms when written; present when `ttlMs` was set on the API. */
  savedAt?: number;
};

function isEnvelope(value: unknown): value is VersionedEnvelope {
  return (
    isPlainObject(value) &&
    '_v' in value &&
    'data' in value &&
    typeof (value as VersionedEnvelope)._v === 'number'
  );
}

/**
 * Legacy: plain string stored without JSON quotes (see `storage.ts`).
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

export type VersionedStorageOptions = {
  /** Latest schema version (integer >= 1). */
  currentVersion: number;
  /**
   * One-step migrators: `migrations[k]` transforms **data** from version `k` to `k + 1`.
   * Required for each `k` in `0 .. currentVersion - 1` when reading older data.
   */
  migrations: Record<number, (prev: unknown) => unknown>;
  /**
   * When set to a positive number, writes include `savedAt` and reads drop the key
   * when `Date.now() > savedAt + ttlMs`. Entries **without** `savedAt` (legacy) are not expired.
   */
  ttlMs?: number;
};

/**
 * Storage API that wraps persisted values as `{ _v, data }` and runs migrations on read.
 * Legacy values without `_v` are treated as version `0` (whole parsed value is `data`).
 */
function envelopeForWrite<T>(
  data: T,
  currentVersion: number,
  ttlMs: number | undefined,
): VersionedEnvelope<T> {
  const env: VersionedEnvelope<T> = { _v: currentVersion, data };
  if (typeof ttlMs === 'number' && ttlMs > 0) {
    env.savedAt = Date.now();
  }
  return env;
}

export function createVersionedStorageApi(storage: Storage, options: VersionedStorageOptions) {
  const { currentVersion, migrations, ttlMs } = options;

  if (!Number.isInteger(currentVersion) || currentVersion < 1) {
    throw new Error('createVersionedStorageApi: currentVersion must be a positive integer');
  }

  function migrateDataFromVersion(data: unknown, fromVersion: number): unknown {
    let next = data;
    let v = fromVersion;
    while (v < currentVersion) {
      const step = migrations[v];
      if (typeof step !== 'function') {
        throw new Error(`createVersionedStorageApi: missing migration from version ${v} to ${v + 1}`);
      }
      next = step(next);
      v += 1;
    }
    return next;
  }

  function readRawParsed(name: string): unknown | null {
    const raw = storage.getItem(name);
    if (raw === null || raw === '') return null;
    const parsed = safeParse<unknown>(raw, null);
    return parsed;
  }

  /**
   * Returns normalized `data` at `currentVersion`, or `undefined` if key missing / unreadable / TTL expired.
   * Does not merge `initData` (caller applies defaults).
   */
  function readNormalizedPayload(name: string): { payload: unknown; didMigrate: boolean } | undefined {
    const parsed = readRawParsed(name);
    if (parsed === null) return undefined;

    let fromVersion: number;
    let data: unknown;
    let savedAt: number | undefined;

    if (isEnvelope(parsed)) {
      fromVersion = parsed._v;
      data = parsed.data;
      if (typeof parsed.savedAt === 'number') {
        savedAt = parsed.savedAt;
      }
    } else {
      fromVersion = 0;
      data = parsed;
    }

    if (fromVersion > currentVersion) {
      return undefined;
    }

    if (
      typeof ttlMs === 'number' &&
      ttlMs > 0 &&
      typeof savedAt === 'number' &&
      Date.now() > savedAt + ttlMs
    ) {
      storage.removeItem(name);
      return undefined;
    }

    if (fromVersion === currentVersion) {
      return { payload: data, didMigrate: false };
    }

    try {
      const migrated = migrateDataFromVersion(data, fromVersion);
      return { payload: migrated, didMigrate: true };
    } catch {
      return undefined;
    }
  }

  function getLocal<T>({ name, initData }: StorageDriverOptions<T>): T {
    if (!assertName(name) || typeof window === 'undefined') return initData as T;
    const parsed = readRawParsed(name);
    if (parsed === null) {
      const raw = storage.getItem(name);
      if (raw === null || raw === '') return initData as T;
      const legacy = tryLegacyPlainString(raw, initData);
      if (legacy !== undefined) return legacy;
      return initData as T;
    }

    const normalized = readNormalizedPayload(name);
    if (normalized === undefined) {
      return initData as T;
    }

    const { payload: migrated, didMigrate } = normalized;

    if (didMigrate) {
      storage.setItem(
        name,
        serializeStorageValue(envelopeForWrite(migrated, currentVersion, ttlMs)),
      );
    }

    if (isPlainObject(initData) && isPlainObject(migrated)) {
      return mergeDeepRight(initData, migrated) as T;
    }
    return migrated as T;
  }

  function setLocal<T>({ name, params }: StorageDriverOptions<T>): T {
    if (!assertName(name) || typeof window === 'undefined') return params as T;
    storage.setItem(
      name,
      serializeStorageValue(envelopeForWrite(params, currentVersion, ttlMs)),
    );
    return params as T;
  }

  function putLocal<T>({ name, initData, params }: StorageDriverOptions<T>): T {
    if (!assertName(name) || typeof window === 'undefined') return params as T;

    const normalized = readNormalizedPayload(name);
    let base: unknown;

    if (normalized === undefined) {
      base = isPlainObject(initData) ? { ...initData } : initData;
    } else {
      const { payload: migrated, didMigrate } = normalized;
      if (didMigrate) {
        storage.setItem(
          name,
          serializeStorageValue(envelopeForWrite(migrated, currentVersion, ttlMs)),
        );
      }
      if (isPlainObject(initData) && isPlainObject(migrated)) {
        base = mergeDeepRight(initData, migrated);
      } else {
        base = migrated;
      }
    }

    const sendData =
      isPlainObject(base) && isPlainObject(params)
        ? mergeDeepRight(base as object, params as object)
        : params;

    storage.setItem(
      name,
      serializeStorageValue(envelopeForWrite(sendData, currentVersion, ttlMs)),
    );
    return sendData as T;
  }

  return { getLocal, setLocal, putLocal };
}
