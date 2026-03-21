import { describe, it, expect, vi } from 'vitest';
import { subscribeStorageKey } from '../src/storage-events.js';

describe('subscribeStorageKey', () => {
  it('invokes onChange when storage event matches key and storageArea', () => {
    const onChange = vi.fn();
    const unsub = subscribeStorageKey(localStorage, 'myKey', onChange);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'myKey',
        newValue: '"v"',
        storageArea: localStorage,
        url: window.location.href,
      }),
    );

    expect(onChange).toHaveBeenCalledWith('"v"');

    unsub();
  });

  it('ignores events for other keys', () => {
    const onChange = vi.fn();
    const unsub = subscribeStorageKey(sessionStorage, 'k', onChange);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'other',
        newValue: 'x',
        storageArea: sessionStorage,
        url: window.location.href,
      }),
    );

    expect(onChange).not.toHaveBeenCalled();
    unsub();
  });

  it('ignores events for other storage areas', () => {
    const onChange = vi.fn();
    const unsub = subscribeStorageKey(localStorage, 'k', onChange);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'k',
        newValue: 'x',
        storageArea: sessionStorage,
        url: window.location.href,
      }),
    );

    expect(onChange).not.toHaveBeenCalled();
    unsub();
  });
});
