import { describe, it, expect } from 'vitest';
import { formatMessage } from './formatMessage.js';

describe('formatMessage', () => {
  it('acepta pattern sin values', () => {
    expect(formatMessage('en', 'Plain text')).toBe('Plain text');
  });

  it('interpolates named placeholders', () => {
    expect(formatMessage('en', 'Hello {name}', { name: 'Ada' })).toBe('Hello Ada');
  });

  it('plural rules in English', () => {
    const pattern = '{count, plural, one {# item} other {# items}}';
    expect(formatMessage('en', pattern, { count: 1 })).toBe('1 item');
    expect(formatMessage('en', pattern, { count: 3 })).toBe('3 items');
  });

  it('plural rules in Spanish', () => {
    const pattern = '{n, plural, one {# archivo} other {# archivos}}';
    expect(formatMessage('es', pattern, { n: 1 })).toBe('1 archivo');
    expect(formatMessage('es', pattern, { n: 5 })).toBe('5 archivos');
  });
});
