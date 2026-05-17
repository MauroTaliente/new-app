import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getLocaleAsync } from './next-server.js';

describe('getLocaleAsync', () => {
  const loaders = {
    es: async () => ({ shared: { hi: 'hola' }, meta: { n: 1 } }),
    en: async () => ({ shared: { hi: 'hi' }, meta: { n: 2 } }),
  };

  it('carga el locale pedido y hace pick del scope', async () => {
    await expect(getLocaleAsync(loaders, 'shared', 'en', 'es')).resolves.toEqual({ hi: 'hi' });
  });

  it('usa fallback cuando lang no está en loaders', async () => {
    await expect(getLocaleAsync(loaders, ['shared', 'meta'], 'fr', 'es')).resolves.toEqual({
      hi: 'hola',
      n: 1,
    });
  });
});
