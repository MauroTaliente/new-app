import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InputSwitch } from '../src/components/molecules/input-switch';

describe('InputSwitch', () => {
  it('renders with role="switch"', () => {
    render(<InputSwitch name="optin" value={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('aria-checked reflects the value', () => {
    const { rerender } = render(
      <InputSwitch name="optin" value={false} onChange={vi.fn()} />,
    );
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');

    rerender(<InputSwitch name="optin" value={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('clicking toggles the value', () => {
    const onChange = vi.fn();
    render(<InputSwitch name="optin" value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('disabled prevents change', () => {
    const onChange = vi.fn();
    render(
      <InputSwitch name="optin" value={false} disabled onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
