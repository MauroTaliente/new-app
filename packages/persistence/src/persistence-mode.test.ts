import { describe, expect, it } from 'vitest';
import { readClientEnv, resolvePersistenceMode } from './persistence-mode.js';

describe('resolvePersistenceMode', () => {
  it('prefers persistenceEnvKey over persistenceMode', () => {
    expect(
      resolvePersistenceMode({
        persistenceMode: 'cookie',
        persistenceEnvKey: 'APP_PERSISTENCE',
        env: { APP_PERSISTENCE: 'localStorage' },
      }),
    ).toBe('localStorage');
  });

  it('falls back to persistenceMode then localStorage', () => {
    expect(resolvePersistenceMode({ persistenceMode: 'cookie' })).toBe('cookie');
    expect(resolvePersistenceMode({})).toBe('localStorage');
  });
});

describe('readClientEnv', () => {
  it('returns an object without throwing', () => {
    expect(typeof readClientEnv()).toBe('object');
  });
});
