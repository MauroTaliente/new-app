/**
 * Subscribe to cross-tab changes for a single `storage` key.
 * Fires only for updates from **other** documents (same origin); same-tab `setItem` does not emit `storage`.
 */
export function subscribeStorageKey(
  storage: Storage,
  key: string,
  onChange: (newValue: string | null) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: StorageEvent) => {
    if (e.storageArea !== storage || e.key !== key) return;
    onChange(e.newValue);
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
