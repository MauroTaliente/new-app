import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PokemonDemo } from '../src/PokemonDemo';

vi.mock('../src/api/apis.client.generated', () => ({
  usePokemonRequest: () => ({
    data: { results: [{ name: 'bulbasaur', url: '' }] },
    loading: false,
    initialLoading: false,
    author: '',
    trigger: () => {},
    error: null,
  }),
}));

describe('PokemonDemo (smoke)', () => {
  it('renders without throwing', () => {
    render(<PokemonDemo />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/PokeAPI/);
    expect(screen.getByText('bulbasaur').textContent).toBe('bulbasaur');
  });
});
