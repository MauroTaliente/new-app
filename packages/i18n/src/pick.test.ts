import { describe, expect, it } from 'vitest';
import { pickScope } from './pick.js';

describe('pickScope', () => {
  const structure = {
    a: { x: 1 },
    b: { y: 2 },
  };

  it('returns one scope', () => {
    expect(pickScope(structure, 'a')).toEqual({ x: 1 });
  });

  it('merges scopes', () => {
    expect(pickScope(structure, ['a', 'b'])).toEqual({ x: 1, y: 2 });
  });

  it('ignora scopes que no son objetos al mergear', () => {
    const mixed = { a: 'plain', b: { y: 2 } };
    expect(pickScope(mixed, ['a', 'b'])).toEqual({ y: 2 });
  });
});
