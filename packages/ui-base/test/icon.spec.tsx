import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from '../src/components/icon.js';

describe('Icon', () => {
  it('renderiza un SVG para un nombre Tabler válido', () => {
    const { container } = render(<Icon name="IconX" aria-label="close" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('no renderiza nada cuando show es false', () => {
    const { container } = render(<Icon name="IconX" show={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('reenvía props al SVG (size)', () => {
    const { container } = render(<Icon name="IconCheck" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });
});
