import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../src/components/button.js';

describe('Button', () => {
  it('renderiza <button> por defecto con type button', () => {
    render(<Button>Save</Button>);
    const el = screen.getByRole('button', { name: 'Save' });
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
  });

  it('renderiza <a> cuando recibe href', () => {
    render(
      <Button href="/docs">
        Docs
      </Button>,
    );
    const el = screen.getByRole('link', { name: 'Docs' });
    expect(el.getAttribute('href')).toBe('/docs');
  });

  it('anchor disabled bloquea click y expone aria-disabled', () => {
    const onClick = vi.fn();
    render(
      <Button href="/x" disabled onClick={onClick}>
        Link
      </Button>,
    );
    const el = screen.getByRole('link', { name: 'Link' });
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('tabindex')).toBe('-1');
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('target _blank agrega rel noopener noreferrer por defecto', () => {
    render(
      <Button href="https://example.com" target="_blank">
        External
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'External' }).getAttribute('rel')).toBe(
      'noopener noreferrer',
    );
  });

  it('respeta rel custom con target _blank', () => {
    render(
      <Button href="https://example.com" target="_blank" rel="nofollow">
        External nofollow
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'External nofollow' }).getAttribute('rel')).toBe(
      'nofollow',
    );
  });

  it('withArea envuelve el control en un contenedor', () => {
    const { container } = render(
      <Button withArea areaClassName="area-test">
        In area
      </Button>,
    );
    const area = container.querySelector('.area-test');
    expect(area).toBeTruthy();
    expect(area?.querySelector('button')).toBeTruthy();
  });

  it('aplica clases de variant y size', () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    );
    const el = screen.getByRole('button', { name: 'Delete' });
    expect(el.className).toContain('bg-negative-200');
    expect(el.className).toContain('h-9');
  });
});
