import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThemeRuntime } from './createThemeRuntime.client.js';

type ThemeName = 'light' | 'dark';

const runtime = createThemeRuntime<ThemeName>({ defaultTheme: 'light' });
const { ThemeProvider, useTheme, ThemeBodySync, defaultTheme } = runtime;

function ThemeReadout({ onReady }: { onReady?: (theme: ThemeName) => void }) {
  const [theme, setTheme] = useTheme();
  onReady?.(theme);
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={() => setTheme('dark')}>
        to-dark
      </button>
      <button type="button" onClick={() => setTheme('light')}>
        to-light
      </button>
    </>
  );
}

describe('createThemeRuntime', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    document.body.className = '';
    document.documentElement.className = '';
    delete document.body.dataset.theme;
  });

  it('expone defaultTheme del runtime', () => {
    expect(defaultTheme).toBe('light');
  });

  it('useTheme lee el default y el updater cambia tema en DOM', () => {
    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    act(() => {
      screen.getByRole('button', { name: 'to-dark' }).click();
    });
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.body.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ThemeProvider acepta value inicial', () => {
    render(
      <ThemeProvider value="dark">
        <ThemeReadout />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('onThemeChange se invoca al montar y en cada cambio', () => {
    const onThemeChange = vi.fn();
    render(
      <ThemeProvider onThemeChange={onThemeChange}>
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(onThemeChange).toHaveBeenCalledWith('light');
    onThemeChange.mockClear();

    act(() => {
      screen.getByRole('button', { name: 'to-dark' }).click();
    });
    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });

  it('ThemeBodySync monta y desmonta clases en body/html', () => {
    const { unmount } = render(
      <ThemeProvider value="light">
        <ThemeBodySync />
      </ThemeProvider>,
    );

    expect(document.body.classList.contains('light')).toBe(true);
    expect(document.body.dataset.theme).toBe('light');

    unmount();
    expect(document.body.classList.contains('light')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('reducer no aplica DOM mientras document está ausente', () => {
    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );

    const doc = globalThis.document;
    // @ts-expect-error
    delete globalThis.document;

    act(() => {
      screen.getByRole('button', { name: 'to-dark' }).click();
    });

    globalThis.document = doc;
    expect(document.body.classList.contains('dark')).toBe(false);
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('ThemeBodySync actualiza al cambiar theme', () => {
    render(
      <ThemeProvider>
        <ThemeBodySync />
        <ThemeReadout />
      </ThemeProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'to-dark' }).click();
    });
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('light')).toBe(false);
  });
});
