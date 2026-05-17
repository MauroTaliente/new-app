import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFormApi, type FormConfig } from '../src/components/organisms/form/use-form-api';

interface SignupValues {
  email: string;
  age: number;
}

const baseConfig = (overrides: Partial<FormConfig<SignupValues>> = {}): FormConfig<SignupValues> => ({
  space: 'signup',
  initialValues: { email: '', age: 0 },
  ...overrides,
});

describe('useFormApi', () => {
  it('connect() exposes initial values', () => {
    const { result } = renderHook(() =>
      useFormApi<SignupValues>(
        baseConfig({ initialValues: { email: 'a@b.com', age: 30 } }),
      ),
    );
    expect(result.current[1].connect('email').value).toBe('a@b.com');
    expect(result.current[1].connect('age').value).toBe(30);
  });

  it('setValue updates state and hasChange', () => {
    const { result } = renderHook(() => useFormApi<SignupValues>(baseConfig()));

    act(() => {
      result.current[1].setValue('email', 'new@example.com');
    });

    expect(result.current[1].values.email).toBe('new@example.com');
    expect(result.current[1].hasChange).toBe(true);
  });

  it('reset returns to initial values', () => {
    const { result } = renderHook(() =>
      useFormApi<SignupValues>(
        baseConfig({ initialValues: { email: 'a@b.com', age: 30 } }),
      ),
    );

    act(() => {
      result.current[1].setValue('email', 'changed@example.com');
    });
    expect(result.current[1].hasChange).toBe(true);

    act(() => {
      result.current[1].reset();
    });
    expect(result.current[1].values.email).toBe('a@b.com');
    expect(result.current[1].hasChange).toBe(false);
  });

  it('isValid is false while a required field is empty', () => {
    const { result } = renderHook(() =>
      useFormApi<SignupValues>(
        baseConfig({
          validatorsRules: {
            email: (v: string) => (v ? undefined : 'required'),
          },
        }),
      ),
    );
    expect(result.current[1].isValid).toBe(false);
  });

  it('isValid becomes true once required field has value', () => {
    const { result } = renderHook(() =>
      useFormApi<SignupValues>(
        baseConfig({
          validatorsRules: {
            email: (v: string) => (v ? undefined : 'required'),
          },
        }),
      ),
    );

    act(() => {
      result.current[1].setValue('email', 'ok@ok.com');
    });
    expect(result.current[1].isValid).toBe(true);
  });

  it('submit invokes onSubmit when valid', () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useFormApi<SignupValues>(
        baseConfig({
          initialValues: { email: 'ok@ok.com', age: 25 },
          onSubmit,
        }),
      ),
    );

    act(() => {
      result.current[1].submit(document.createElement('form'), 'unit');
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('submit invokes onReject when invalid', () => {
    const onSubmit = vi.fn();
    const onReject = vi.fn();
    const { result } = renderHook(() =>
      useFormApi<SignupValues>(
        baseConfig({
          validatorsRules: {
            email: (v: string) => (v ? undefined : 'required'),
          },
          onSubmit,
          onReject,
        }),
      ),
    );

    act(() => {
      result.current[1].submit(document.createElement('form'), 'unit');
    });
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
