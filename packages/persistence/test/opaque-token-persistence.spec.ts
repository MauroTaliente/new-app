import { beforeEach, describe, expect, it } from 'vitest';
import { createOpaqueTokenPersistence } from '../src/opaque-token-persistence';

describe('createOpaqueTokenPersistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('writes and reads a refresh token', () => {
    const store = createOpaqueTokenPersistence({ key: 'test.refresh' });
    store.write('rt_abc');
    expect(store.read()).toBe('rt_abc');
  });

  it('clear removes the value', () => {
    const store = createOpaqueTokenPersistence({ key: 'test.refresh' });
    store.write('rt_abc');
    store.clear();
    expect(store.read()).toBeNull();
  });
});
