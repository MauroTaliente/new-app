import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocaleRuntime } from './createLocaleRuntime.client.js';

type Locale = 'es' | 'en';
type Structure = {
  shared: {
    hello: string;
    greeting: string;
    items: string;
  };
};

const dictionaries: Record<Locale, Structure> = {
  es: {
    shared: {
      hello: 'Hola',
      greeting: 'Hola, {name}!',
      items: '{count, plural, one {# ítem} other {# ítems}}',
    },
  },
  en: {
    shared: {
      hello: 'Hello',
      greeting: 'Hello, {name}!',
      items: '{count, plural, one {# item} other {# items}}',
    },
  },
};

const runtime = createLocaleRuntime<Locale, Structure>({
  defaultLocale: 'es',
  dictionaries,
});
const { LocaleProvider, useLocale, useDict, useTf, defaultLocale } = runtime;

function LocaleReadout() {
  const [locale, setLocale] = useLocale();
  const shared = useDict('shared');
  const t = useTf('shared');
  return (
    <>
      <span data-testid="locale">{locale}</span>
      <span data-testid="hello">{shared.hello}</span>
      <span data-testid="tf">{t('hello')}</span>
      <button type="button" onClick={() => setLocale('en')}>
        to-en
      </button>
    </>
  );
}

function TfIcuReadout() {
  const [locale, setLocale] = useLocale();
  const t = useTf('shared');
  return (
    <>
      <span data-testid="locale">{locale}</span>
      <span data-testid="greeting">{t('greeting', { name: 'Ada' })}</span>
      <span data-testid="items-one">{t('items', { count: 1 })}</span>
      <span data-testid="items-many">{t('items', { count: 3 })}</span>
      <span data-testid="missing">{t('missingKey' as 'hello')}</span>
      <button type="button" onClick={() => setLocale('en')}>
        to-en
      </button>
    </>
  );
}

describe('createLocaleRuntime', () => {
  afterEach(() => {
    cleanup();
  });

  it('expone defaultLocale del runtime', () => {
    expect(defaultLocale).toBe('es');
  });

  it('useLocale y useDict resuelven según locale activo', () => {
    render(
      <LocaleProvider>
        <LocaleReadout />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('es');
    expect(screen.getByTestId('hello').textContent).toBe('Hola');
    expect(screen.getByTestId('tf').textContent).toBe('Hola');

    act(() => {
      screen.getByRole('button', { name: 'to-en' }).click();
    });
    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('hello').textContent).toBe('Hello');
    expect(screen.getByTestId('tf').textContent).toBe('Hello');
  });

  it('LocaleProvider acepta value inicial', () => {
    render(
      <LocaleProvider value="en">
        <LocaleReadout />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('en');
  });

  it('onLocaleChange se invoca al montar y en cada cambio', () => {
    const onLocaleChange = vi.fn();
    render(
      <LocaleProvider onLocaleChange={onLocaleChange}>
        <LocaleReadout />
      </LocaleProvider>,
    );
    expect(onLocaleChange).toHaveBeenCalledWith('es');
    onLocaleChange.mockClear();
    act(() => {
      screen.getByRole('button', { name: 'to-en' }).click();
    });
    expect(onLocaleChange).toHaveBeenCalledWith('en');
  });

  describe('useTf', () => {
    it('interpola ICU según locale activo', () => {
      render(
        <LocaleProvider>
          <TfIcuReadout />
        </LocaleProvider>,
      );
      expect(screen.getByTestId('greeting').textContent).toBe('Hola, Ada!');
      expect(screen.getByTestId('items-one').textContent).toBe('1 ítem');
      expect(screen.getByTestId('items-many').textContent).toBe('3 ítems');
    });

    it('actualiza plurales al cambiar locale', () => {
      render(
        <LocaleProvider>
          <TfIcuReadout />
        </LocaleProvider>,
      );
      act(() => {
        screen.getByRole('button', { name: 'to-en' }).click();
      });
      expect(screen.getByTestId('greeting').textContent).toBe('Hello, Ada!');
      expect(screen.getByTestId('items-one').textContent).toBe('1 item');
      expect(screen.getByTestId('items-many').textContent).toBe('3 items');
    });

    it('devuelve la clave como string si el mensaje no existe', () => {
      render(
        <LocaleProvider>
          <TfIcuReadout />
        </LocaleProvider>,
      );
      expect(screen.getByTestId('missing').textContent).toBe('missingKey');
    });
  });
});
