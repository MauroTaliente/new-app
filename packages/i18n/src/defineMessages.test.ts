import { describe, expect, it } from 'vitest';
import { defineMessages } from './defineMessages.js';

describe('defineMessages', () => {
  it('devuelve el mismo mapa tipado (identidad)', () => {
    const messages = defineMessages({
      greeting: 'Hello {name}',
      count: '{n, plural, one {#} other {#}}',
    } as const);

    expect(messages.greeting).toBe('Hello {name}');
    expect(messages.count).toBe('{n, plural, one {#} other {#}}');
  });
});
