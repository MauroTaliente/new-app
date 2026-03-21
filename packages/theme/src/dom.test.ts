import { describe, it, expect, beforeEach } from 'vitest';
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

  it('mounts and unmounts theme classes', () => {
    mountThemeToDocument('light');
    expect(document.body.classList.contains('light')).toBe(true);
    expect(document.body.dataset.theme).toBe('light');
    unmountThemeFromDocument('light');
    expect(document.body.classList.contains('light')).toBe(false);
  });
});
