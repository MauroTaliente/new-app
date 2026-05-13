import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InputText } from '../src/components/molecules/input-text';

describe('InputText', () => {
  it('renders an <input> in text mode by default', () => {
    const { container } = render(<InputText name="email" value="" onChange={vi.fn()} />);
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.querySelector('textarea')).toBeNull();
  });

  it('renders a <textarea> when mode="area"', () => {
    const { container } = render(
      <InputText name="bio" mode="area" value="" onChange={vi.fn()} />,
    );
    expect(container.querySelector('textarea')).not.toBeNull();
  });

  it('calls onChange with the decoded value when typing', () => {
    const onChange = vi.fn();
    const { container } = render(
      <InputText name="email" value="" onChange={onChange} />,
    );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('shows a clear button when isClearable and value present', () => {
    const onChange = vi.fn();
    render(
      <InputText name="email" value="abc" isClearable onChange={onChange} />,
    );
    expect(screen.getByLabelText('Clear')).toBeTruthy();
  });

  it('does not show clear button when value is empty', () => {
    render(
      <InputText name="email" value="" isClearable onChange={vi.fn()} />,
    );
    expect(screen.queryByLabelText('Clear')).toBeNull();
  });
});
