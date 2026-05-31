'use client';

/**
 * createPersistedSignal — a reactive, storage-backed signal for state whose
 * **source of truth lives outside React** (so it can be read synchronously from
 * non-React code) yet still drives React subscribers.
 *
 * It is the counterpart to `newContext` (`@react33/react-context`):
 * - `newContext`           → the context **owns** the data (reducer + dispatch).
 * - `createPersistedSignal`→ the data lives in storage; React is a **subscriber**.
 *
 * Why this exists (and isn't just the loose `get/set/subscribe` helpers):
 * `subscribeStorageKey` only fires on the **cross-tab** `storage` event — the
 * tab that wrote never hears its own change. This factory owns `set` + a
 * **same-tab** in-process emitter together, so same-tab reactivity is correct
 * by construction (a loose `setLocalStorage` call can't bypass it). `get()` is a
 * plain sync read for non-React callers; `use()` is a `useSyncExternalStore`
 * binding (same-tab + cross-tab) with a snapshot cache for stable references.
 */
import { useSyncExternalStore } from 'react';
import {
  getLocalStorage,
  getSessionStorage,
  setLocalStorage,
  setSessionStorage,
} from './storage';
import { subscribeStorageKey } from './storage-events';

export interface PersistedSignalOptions<T> {
  /** Storage key. */
  key: string;
  /** Which Web Storage area. Defaults to `'local'`. */
  storage?: 'local' | 'session';
  /** Value returned when the key is absent (and the SSR snapshot). */
  initData: T;
}

export interface PersistedSignal<T> {
  /** Synchronous read — safe to call from non-React modules. */
  get(): T;
  /** Persist a new value and notify subscribers (same-tab + cross-tab). */
  set(value: T): void;
  /** Subscribe to changes; returns an unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** React binding (`useSyncExternalStore`). */
  use(): T;
}

/** Same-tab emitter registry, keyed by `${area}:${key}`. */
const sameTabListeners = new Map<string, Set<() => void>>();

function emitSameTab(id: string): void {
  const listeners = sameTabListeners.get(id);
  if (listeners) for (const listener of listeners) listener();
}

function onSameTab(id: string, listener: () => void): () => void {
  let listeners = sameTabListeners.get(id);
  if (!listeners) {
    listeners = new Set();
    sameTabListeners.set(id, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners?.delete(listener);
    if (listeners && listeners.size === 0) sameTabListeners.delete(id);
  };
}

export function createPersistedSignal<T>(
  options: PersistedSignalOptions<T>,
): PersistedSignal<T> {
  const { key, initData } = options;
  const area = options.storage ?? 'local';
  const id = `${area}:${key}`;
  const read = area === 'session' ? getSessionStorage : getLocalStorage;
  const write = area === 'session' ? setSessionStorage : setLocalStorage;
  const rawStorage: Storage | undefined =
    typeof window === 'undefined'
      ? undefined
      : area === 'session'
        ? window.sessionStorage
        : window.localStorage;

  // Snapshot cache keyed by the raw stored string, so `get()` (and therefore
  // `useSyncExternalStore`) returns a stable reference while unchanged — this
  // is what keeps object-valued signals from looping the store hook.
  let cachedRaw: string | null = null;
  let cachedValue: T = initData;
  let primed = false;

  const get = (): T => {
    if (!rawStorage) return initData;
    const raw = rawStorage.getItem(key);
    if (primed && raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    cachedValue = read<T>({ name: key, initData });
    primed = true;
    return cachedValue;
  };

  const set = (value: T): void => {
    write<T>({ name: key, params: value });
    emitSameTab(id); // the same-tab notification react33 storage events lack
  };

  const subscribe = (listener: () => void): () => void => {
    const offSameTab = onSameTab(id, listener);
    const offCrossTab = rawStorage
      ? subscribeStorageKey(rawStorage, key, () => listener())
      : () => {};
    return () => {
      offSameTab();
      offCrossTab();
    };
  };

  const use = (): T =>
    useSyncExternalStore(subscribe, get, () => initData);

  return { get, set, subscribe, use };
}
