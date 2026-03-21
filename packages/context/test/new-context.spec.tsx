import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { newContext } from '../src/new-context.client.js';

const { TestProvider, useTestState, useTestUpdater } = newContext({
  name: 'test',
  initValues: { n: 0 },
  reducer: (s: { n: number }, a: { type: 'inc' }) => {
    if (a.type === 'inc') return { n: s.n + 1 };
    return s;
  },
});

function Counter() {
  const s = useTestState();
  const dispatch = useTestUpdater();
  return (
    <button type="button" onClick={() => dispatch({ type: 'inc' })}>
      count:{s.n}
    </button>
  );
}

describe('newContext', () => {
  it('provides initial state and updates via reducer', () => {
    render(
      <TestProvider>
        <Counter />
      </TestProvider>,
    );
    expect(screen.getByRole('button').textContent).toBe('count:0');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('count:1');
  });
});
