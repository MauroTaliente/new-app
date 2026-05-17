import { beforeEach, describe, expect, it } from 'vitest';
import { applyThemeToDocument, mountThemeToDocument, unmountThemeFromDocument } from './dom.js';

describe('applyThemeToDocument', () => {
  beforeEach(() => {
    document.body.className = '';
    document.documentElement.className = '';
    delete document.body.dataset.theme;
  });

  it('replaces classes and data-theme', () => {
    document.body.classList.add('light');
    document.documentElement.classList.add('light');
    applyThemeToDocument('light', 'dark');
    expect(document.body.classList.contains('light')).toBe(false);
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.dataset.theme).toBe('dark');
  });

  it('no hace nada sin document (SSR)', () => {
    const doc = globalThis.document;
    // @ts-expect-error — entorno sin DOM
    delete globalThis.document;
    expect(() => applyThemeToDocument('light', 'dark')).not.toThrow();
    globalThis.document = doc;
  });

  it('is a no-op when prev === next', () => {
    document.body.classList.add('dark');
    applyThemeToDocument('dark', 'dark');
    expect(document.body.className.split(/\s+/).filter(Boolean).length).toBe(1);
  });
});

describe('mountThemeToDocument / unmountThemeFromDocument', () => {
  beforeEach(() => {
    document.body.className = '';
    document.documentElement.className = '';
    delete document.body.dataset.theme;
  });

  it('mount y unmount no hacen nada sin document', () => {
    const doc = globalThis.document;
    // @ts-expect-error
    delete globalThis.document;
    expect(() => {
      mountThemeToDocument('light');
      unmountThemeFromDocument('light');
    }).not.toThrow();
    globalThis.document = doc;
  });

  it('mounts and unmounts theme classes', () => {
    mountThemeToDocument('light');
    expect(document.body.classList.contains('light')).toBe(true);
    expect(document.body.dataset.theme).toBe('light');
    unmountThemeFromDocument('light');
    expect(document.body.classList.contains('light')).toBe(false);
  });
});
