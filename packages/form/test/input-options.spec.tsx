import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  InputOptions,
  moveActiveIndex,
  normalizeActiveIndex,
  normalizeOptionText,
  pickActiveOption,
  readOptionLabel,
  resolveOptionsDirection,
  splitInputSegments,
  toOptionArray,
  toOptionText,
} from '../src/components/electrons/input-options';

describe('input-options pure helpers', () => {
  it('normalizeActiveIndex clamps to list bounds', () => {
    expect(normalizeActiveIndex(-1, 3)).toBe(0);
    expect(normalizeActiveIndex(9, 3)).toBe(2);
    expect(normalizeActiveIndex(1, 0)).toBe(-1);
  });

  it('moveActiveIndex wraps next/prev', () => {
    expect(moveActiveIndex(0, 3, 'prev')).toBe(2);
    expect(moveActiveIndex(2, 3, 'next')).toBe(0);
    expect(moveActiveIndex(1, 3, 'next')).toBe(2);
  });

  it('pickActiveOption returns item at normalized index', () => {
    expect(pickActiveOption(['a', 'b'], 5)).toBe('b');
    expect(pickActiveOption([], 0)).toBeUndefined();
  });

  it('splitInputSegments trims comma-separated tokens', () => {
    expect(splitInputSegments('  a , b,  ')).toEqual(['a', 'b']);
    expect(splitInputSegments('')).toEqual([]);
  });

  it('toOptionArray coerces non-arrays to empty', () => {
    expect(toOptionArray(null)).toEqual([]);
    expect(toOptionArray([1])).toEqual([1]);
  });

  it('toOptionText and readOptionLabel resolve primitives and objects', () => {
    expect(toOptionText(42)).toBe('42');
    expect(readOptionLabel({ id: 'x', label: 'Item' }, 'id', 'label')).toBe('Item');
    expect(readOptionLabel({ id: 'x' }, 'id')).toBe('x');
    expect(normalizeOptionText('  AbC ')).toBe('abc');
  });

  it('resolveOptionsDirection prefers up when space below is tight', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({
      bottom: window.innerHeight - 10,
      top: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    expect(resolveOptionsDirection(input, 280)).toBe('up');
    input.remove();
  });
});

describe('InputOptions component', () => {
  const options = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
  ];

  const baseProps = {
    isOpen: true,
    options,
    getOptionKey: (o: (typeof options)[0]) => o.id,
    getOptionLabel: (o: (typeof options)[0]) => o.label,
  };

  it('renders empty state when open with no options', () => {
    render(<InputOptions {...baseProps} options={[]} emptyLabel="Sin datos" />);
    expect(screen.getByText('Sin datos')).toBeTruthy();
  });

  it('calls onSelect on mouse down', () => {
    const onSelect = vi.fn();
    render(<InputOptions {...baseProps} onSelect={onSelect} activeIndex={0} />);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Alpha' }));
    expect(onSelect).toHaveBeenCalledWith(options[0], 0);
  });

  it('calls onSelect on Enter key', () => {
    const onSelect = vi.fn();
    render(<InputOptions {...baseProps} onSelect={onSelect} />);
    const first = screen.getByRole('option', { name: 'Alpha' });
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(options[0], 0);
  });

  it('forwards onHoverIndexChange on mouse enter', () => {
    const onHoverIndexChange = vi.fn();
    render(<InputOptions {...baseProps} onHoverIndexChange={onHoverIndexChange} />);
    fireEvent.mouseEnter(screen.getByRole('option', { name: 'Beta' }));
    expect(onHoverIndexChange).toHaveBeenCalledWith(1);
  });
});
