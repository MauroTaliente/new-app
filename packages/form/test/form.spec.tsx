import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Form } from '../src/components/organisms/form/form';

describe('Form', () => {
  it('renders a real <form> element', () => {
    const { container } = render(
      <Form config={{ space: 'a', initialValues: {} }}>
        <span>child</span>
      </Form>,
    );
    expect(container.querySelector('form')).not.toBeNull();
    expect(screen.getByText('child')).toBeTruthy();
  });

  it('calls onSubmit with values when api.submit fires (valid)', () => {
    const onSubmit = vi.fn();
    render(
      <Form
        config={{
          space: 'signup-ok',
          initialValues: { email: 'a@b.com' },
          onSubmit,
        }}
      >
        {(api) => (
          <button
            type="button"
            data-testid="submit"
            onClick={(e) => api.submit(e, 'unit')}
          >
            Go
          </button>
        )}
      </Form>,
    );

    fireEvent.click(screen.getByTestId('submit'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const apiArg = onSubmit.mock.calls[0][0];
    expect(apiArg.connect('email').value).toBe('a@b.com');
  });

  it('calls onReject when invalid', () => {
    const onReject = vi.fn();
    const onSubmit = vi.fn();

    render(
      <Form
        config={{
          space: 'signup-bad',
          initialValues: { email: '' },
          validatorsRules: {
            email: (v: string) => (v ? undefined : 'required'),
          },
          onSubmit,
          onReject,
        }}
      >
        {(api) => (
          <button
            type="button"
            data-testid="submit"
            onClick={(e) => api.submit(e, 'unit')}
          >
            Go
          </button>
        )}
      </Form>,
    );

    fireEvent.click(screen.getByTestId('submit'));
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
