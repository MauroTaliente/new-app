import { describe, it, expect } from 'vitest';
import { useLayoutEffect } from 'react';
import { useIsomorphicLayoutEffect } from '../src/layout.js';

describe('useIsomorphicLayoutEffect', () => {
  it('en happy-dom coincide con useLayoutEffect', () => {
    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });
});
