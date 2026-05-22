import { createElement, Fragment, isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ct } from './ct.js';

describe('ct', () => {
  it('devuelve un fragmento vacío para texto vacío', () => {
    const nodes = ct('');
    expect(nodes).toHaveLength(1);
    expect(isValidElement(nodes[0])).toBe(true);
    expect((nodes[0] as unknown as { type: typeof Fragment }).type).toBe(Fragment);
  });

  it('interpolación {{var}} y deja placeholder si falta', () => {
    expect(ct('Hola {{name}}', { name: 'Ada' })).toEqual(['Hola ', 'Ada']);
    expect(ct('{{missing}}')).toEqual(['{{missing}}']);
  });

  it('convierte saltos de línea en <br />', () => {
    const nodes = ct('a\nb');
    expect(nodes[0]).toBe('a');
    expect(isValidElement(nodes[1])).toBe(true);
    expect((nodes[1] as { type: string }).type).toBe('br');
    expect(nodes[2]).toBe('b');
  });

  it('envuelve pseudo-tags con componentes custom', () => {
    const nodes = ct('<b>negrita</b>', null, {
      b: (children) => createElement('strong', null, children),
    });
    expect(nodes).toHaveLength(1);
    const wrapped = nodes[0];
    expect(isValidElement(wrapped)).toBe(true);
    const inner = (wrapped as { props: { children: unknown } }).props.children;
    expect(isValidElement(inner)).toBe(true);
    expect((inner as { type: string }).type).toBe('strong');
  });

  it('avisa en consola si las etiquetas no coinciden', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ct('<a></b>');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Tag mismatch'));
    warn.mockRestore();
  });
});
