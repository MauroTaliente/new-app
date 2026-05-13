import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InputFrame } from '../src/components/electrons/input-frame';

describe('InputFrame', () => {
  it('renders children inside the frame', () => {
    render(
      <InputFrame>
        <input data-testid="probe" />
      </InputFrame>,
    );
    expect(screen.getByTestId('probe')).toBeTruthy();
  });

  it('clear button only shows when isClearable AND onClear provided', () => {
    const { rerender } = render(
      <InputFrame isClearable>
        <input />
      </InputFrame>,
    );
    expect(screen.queryByLabelText('Clear')).toBeNull();

    const onClear = vi.fn();
    rerender(
      <InputFrame isClearable onClear={onClear}>
        <input />
      </InputFrame>,
    );
    const clearButton = screen.getByLabelText('Clear');
    expect(clearButton).toBeTruthy();

    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('indicators container is non-interactive (pointer-events-none)', () => {
    const { container } = render(
      <InputFrame indicators="all" showError>
        <input />
      </InputFrame>,
    );
    const indicators = container.querySelector('[class*="pointer-events-none"]');
    expect(indicators).toBeTruthy();
  });
});
