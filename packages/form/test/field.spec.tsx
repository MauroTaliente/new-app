import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field } from '../src/components/molecules/field';

describe('Field', () => {
  it('renders label and required marker', () => {
    render(
      <Field name="email" label="Email" required>
        <input data-testid="probe" />
      </Field>,
    );
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('injects aria-invalid and disabled into child', () => {
    render(
      <Field name="email" error="required" showError disabled>
        <input data-testid="probe" />
      </Field>,
    );
    const input = screen.getByTestId('probe') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.hasAttribute('disabled')).toBe(true);
  });

  it('child props override injected props on conflict', () => {
    render(
      <Field name="email" disabled>
        <input data-testid="probe" disabled={false} />
      </Field>,
    );
    const input = screen.getByTestId('probe') as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });

  it('shows error message only when showError is truthy', () => {
    const { rerender } = render(
      <Field name="email" error="required" showError={false}>
        <input />
      </Field>,
    );
    expect(screen.queryByText('required')).toBeNull();

    rerender(
      <Field name="email" error="required" showError>
        <input />
      </Field>,
    );
    expect(screen.getByText('required')).toBeTruthy();
  });

  it('renders disclaimer when provided', () => {
    render(
      <Field name="email" disclaimer="We never share your address">
        <input />
      </Field>,
    );
    expect(screen.getByText('We never share your address')).toBeTruthy();
  });
});
