import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useFormState } from '../src/components/organisms/form/form-provider';

describe('FormProvider', () => {
  it('useFormState resolves api after registry commit', async () => {
    function EmailReader() {
      const api = useFormState<{ email: string }>('signup');
      return <span data-testid="email-value">{api.values.email}</span>;
    }

    render(
      <FormProvider config={{ space: 'signup', initialValues: { email: 'ctx@test.com' } }}>
        <EmailReader />
      </FormProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('email-value').textContent).toBe('ctx@test.com');
    });
  });

  it('exposes api via render prop and submits', () => {
    const onSubmit = vi.fn();
    render(
      <FormProvider
        config={{
          space: 'signup',
          initialValues: { email: 'ok@test.com' },
          onSubmit,
        }}
      >
        {(api) => (
          <>
            <input
              data-testid="email"
              value={api.connect('email').value ?? ''}
              onChange={(e) => api.connect('email').onChange?.(e.target.value)}
            />
            <button type="button" data-testid="submit" onClick={(e) => api.submit(e, 'unit')}>
              Send
            </button>
          </>
        )}
      </FormProvider>,
    );

    expect((screen.getByTestId('email') as HTMLInputElement).value).toBe('ok@test.com');
    fireEvent.click(screen.getByTestId('submit'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('throws when useFormState name is missing from registry', () => {
    const BadConsumer = () => {
      useFormState('missing');
      return null;
    };
    expect(() =>
      render(
        <FormProvider config={{ space: 'signup', initialValues: { email: '' } }}>
          <BadConsumer />
        </FormProvider>,
      ),
    ).toThrow(/not found in context/);
  });
});
