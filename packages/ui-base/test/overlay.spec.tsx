import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Overlay } from '../src/components/overlay.js';

describe('Overlay', () => {
  it('muestra hijos cuando no está activo (mode cover)', () => {
    render(
      <Overlay active={false}>
        <span>content</span>
      </Overlay>,
    );
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('mode conditional oculta hijos cuando está activo', () => {
    render(
      <Overlay active mode="conditional">
        <span>hidden-when-active</span>
      </Overlay>,
    );
    expect(screen.queryByText('hidden-when-active')).toBeNull();
  });

  it('variant loader muestra spinner cuando está activo', () => {
    const { container } = render(
      <Overlay active variant="loader">
        <span>under</span>
      </Overlay>,
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute('role')).toBe('status');
    expect(root?.querySelector('svg')).toBeTruthy();
  });

  it('mode cover mantiene hijos montados aunque esté activo', () => {
    render(
      <Overlay active mode="cover">
        <span>still-mounted</span>
      </Overlay>,
    );
    expect(screen.getByText('still-mounted')).toBeTruthy();
  });
});
