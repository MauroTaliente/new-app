import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const useParams = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => useParams(),
}));

import { useGetAllLocale, useGetLocale, useLocaleFromParams } from './next.client.js';

const dictionaries = {
  es: { shared: { hi: 'hola' } },
  en: { shared: { hi: 'hi' } },
} as const;

describe('useLocaleFromParams', () => {
  beforeEach(() => {
    useParams.mockReturnValue({ lang: 'en' });
  });

  it('lee lang del segmento dinámico', () => {
    const { result } = renderHook(() => useLocaleFromParams());
    expect(result.current).toBe('en');
  });

  it('toma el primer valor si el param es array', () => {
    useParams.mockReturnValue({ lang: ['en', 'es'] });
    const { result } = renderHook(() => useLocaleFromParams());
    expect(result.current).toBe('en');
  });

  it('respeta paramName custom', () => {
    useParams.mockReturnValue({ locale: 'es' });
    const { result } = renderHook(() => useLocaleFromParams({ paramName: 'locale' }));
    expect(result.current).toBe('es');
  });

  it('undefined si el param no existe', () => {
    useParams.mockReturnValue({});
    const { result } = renderHook(() => useLocaleFromParams());
    expect(result.current).toBeUndefined();
  });
});

describe('useGetLocale / useGetAllLocale', () => {
  beforeEach(() => {
    useParams.mockReturnValue({ lang: 'en' });
  });

  it('useGetLocale delega en getLocale con lang de params', () => {
    const { result } = renderHook(() =>
      useGetLocale(dictionaries, 'shared', { fallbackLocale: 'es' }),
    );
    expect(result.current).toEqual({ hi: 'hi' });
  });

  it('useGetAllLocale devuelve el diccionario completo', () => {
    const { result } = renderHook(() =>
      useGetAllLocale(dictionaries, { fallbackLocale: 'es' }),
    );
    expect(result.current).toEqual(dictionaries.en);
  });
});
