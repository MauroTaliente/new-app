import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCookie,
  parseDocumentCookie,
  putCookie,
  setCookie,
} from '../src/cookie-browser.js';

function clearCookies() {
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

describe('parseDocumentCookie', () => {
  it('parses encoded name=value pairs', () => {
    expect(parseDocumentCookie('a=1; b=hello%20world')).toEqual({
      a: '1',
      b: 'hello world',
    });
  });

  it('returns empty object for blank header', () => {
    expect(parseDocumentCookie('   ')).toEqual({});
  });
});

describe('cookie browser api', () => {
  beforeEach(() => {
    clearCookies();
  });

  it('round-trips JSON via setCookie/getCookie', () => {
    setCookie({ name: 'prefs', params: { theme: 'dark' } });
    expect(getCookie({ name: 'prefs', initData: { theme: 'light' } })).toEqual({
      theme: 'dark',
    });
  });

  it('putCookie deep-merges object cookies', () => {
    setCookie({ name: 'prefs', params: { a: 1, b: 2 } });
    putCookie({ name: 'prefs', initData: {}, params: { b: 3, c: 4 } });
    expect(getCookie({ name: 'prefs', initData: {} })).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('returns initData when name is empty', () => {
    expect(getCookie({ name: '', initData: 'fallback' })).toBe('fallback');
  });
});
