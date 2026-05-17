import { describe, expect, it } from 'vitest';
import { getAllLocale, getLocale } from './getLocale.js';

describe('getLocale', () => {
  const dictionaries = {
    es: { shared: { hi: 'hola' }, other: { n: 1 } },
    en: { shared: { hi: 'hi' }, other: { n: 2 } },
  };

  it('picks fallback when lang missing', () => {
    expect(getLocale(dictionaries, undefined, 'es', 'shared')).toEqual({ hi: 'hola' });
  });

  it('picks fallback when lang es null o desconocido', () => {
    expect(getLocale(dictionaries, null, 'es', 'shared')).toEqual({ hi: 'hola' });
    expect(getLocale(dictionaries, 'fr', 'es', 'shared')).toEqual({ hi: 'hola' });
  });

  it('picks requested lang', () => {
    expect(getLocale(dictionaries, 'en', 'es', 'shared')).toEqual({ hi: 'hi' });
  });

  it('merges scopes', () => {
    expect(getLocale(dictionaries, 'es', 'en', ['shared', 'other'])).toEqual({ hi: 'hola', n: 1 });
  });

  it('getAllLocale', () => {
    expect(getAllLocale(dictionaries, 'en', 'es')).toEqual(dictionaries.en);
  });
});
