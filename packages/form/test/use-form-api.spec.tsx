import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  FORM_MESSAGE_KEY,
  useFormApi,
  type FormConfig,
} from '../src/components/organisms/form/use-form-api';

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

  it('two sequential setValue in one tick commit BOTH fields', () => {
    const { result } = renderHook(() => useFormApi<SignupValues>(baseConfig()));
    act(() => {
      result.current[1].setValue('email', 'a@a.com');
      result.current[1].setValue('age', 42);
    });
    expect(result.current[1].values.email).toBe('a@a.com');
    expect(result.current[1].values.age).toBe(42);
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

  it('setMessage exposes server error in connect without affecting isValid', () => {
    const { result } = renderHook(() =>
      useFormApi<SignupValues>(
        baseConfig({
          initialValues: { email: 'ok@ok.com', age: 0 },
          validatorsRules: {
            email: (v: string) => (v ? undefined : 'required'),
          },
        }),
      ),
    );

    act(() => {
      result.current[1].setMessage('email', 'Email already taken');
      result.current[1].setTouch('email', true);
    });

    expect(result.current[1].isValid).toBe(true);
    expect(result.current[1].messages).toEqual({ email: 'Email already taken' });

    act(() => {
      result.current[1].setValue('email', 'other@ok.com');
    });

    expect(result.current[1].isValid).toBe(true);
    expect(result.current[1].messages).toEqual({});
    expect(result.current[1].connect('email').error).toBeUndefined();

    act(() => {
      result.current[1].setMessage('email', 'Email already taken');
      result.current[1].setTouch('email', true);
    });

    expect(result.current[1].isValid).toBe(true);
    expect(result.current[1].connect('email').error).toBe('Email already taken');
  });

  it('connect() does not expose status', () => {
    const { result } = renderHook(() => useFormApi<SignupValues>(baseConfig()));
    expect(result.current[1].connect('email')).not.toHaveProperty('status');
  });

  it('setMessage supports form-level key and clearMessages on reset', () => {
    const { result } = renderHook(() => useFormApi<SignupValues>(baseConfig()));

    act(() => {
      result.current[1].setMessage(FORM_MESSAGE_KEY, 'Could not save');
    });
    expect((result.current[1].messages as Record<string, unknown>)[FORM_MESSAGE_KEY]).toBe(
      'Could not save',
    );

    act(() => {
      result.current[1].reset();
    });
    expect(result.current[1].messages).toEqual({});
  });

  it('setValue clears field message', () => {
    const { result } = renderHook(() =>
      useFormApi<SignupValues>(
        baseConfig({ initialValues: { email: 'a@b.com', age: 0 } }),
      ),
    );

    act(() => {
      result.current[1].setMessage('email', 'Stale');
      result.current[1].setTouch('email', true);
    });
    expect(result.current[1].connect('email').error).toBe('Stale');

    act(() => {
      result.current[1].setValue('email', 'b@c.com');
    });
    expect(result.current[1].connect('email').error).toBeUndefined();
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

interface RangeValues {
  start: string;
  end: string;
  name: string;
}

const rangeConfig = (
  overrides: Partial<FormConfig<RangeValues>> = {},
): FormConfig<RangeValues> => ({
  space: 'range',
  initialValues: { start: '', end: '', name: '' },
  ...overrides,
});

describe('connectRange', () => {
  it('value is the [start, end] tuple read from both fields', () => {
    const { result } = renderHook(() =>
      useFormApi<RangeValues>(
        rangeConfig({ initialValues: { start: 'a', end: 'b', name: '' } }),
      ),
    );
    expect(result.current[1].connectRange('start', 'end').value).toEqual([
      'a',
      'b',
    ]);
  });

  it('onChange([a, b]) commits each end to its own field', () => {
    const { result } = renderHook(() => useFormApi<RangeValues>(rangeConfig()));
    act(() => {
      result.current[1].connectRange('start', 'end').onChange?.(['x', 'y']);
    });
    expect(result.current[1].values.start).toBe('x');
    expect(result.current[1].values.end).toBe('y');
  });

  it('onChange(scalar) sets start and clears end', () => {
    const { result } = renderHook(() =>
      useFormApi<RangeValues>(
        rangeConfig({ initialValues: { start: 'a', end: 'b', name: '' } }),
      ),
    );
    act(() => {
      result.current[1]
        .connectRange('start', 'end')
        .onChange?.('only' as unknown as [string, string]);
    });
    expect(result.current[1].values.start).toBe('only');
    expect(result.current[1].values.end).toBeUndefined();
  });

  it('merges error/touched/focus across both fields', () => {
    const { result } = renderHook(() =>
      useFormApi<RangeValues>(
        rangeConfig({
          validatorsRules: {
            end: (v: string) => (v ? undefined : 'end required'),
          },
        }),
      ),
    );
    act(() => {
      result.current[1].validate();
      result.current[1].setBlur('end', false);
    });
    const range = result.current[1].connectRange('start', 'end');
    expect(range.error).toBe('end required');
    expect(range.touched).toBe(true);
  });
});

interface CoverValues {
  cover_url: string;
  cover_id: string;
  name: string;
}

const coverConfig = (
  overrides: Partial<FormConfig<CoverValues>> = {},
): FormConfig<CoverValues> => ({
  space: 'cover',
  initialValues: { cover_url: '', cover_id: '', name: '' },
  ...overrides,
});

describe('connectEntity', () => {
  it('value is the entity keyed by INPUT keys, read from the mapped fields', () => {
    const { result } = renderHook(() =>
      useFormApi<CoverValues>(
        coverConfig({
          initialValues: { cover_url: 'u', cover_id: 'a1', name: '' },
        }),
      ),
    );
    const entity = result.current[1].connectEntity({
      url: 'cover_url',
      assetId: 'cover_id',
    });
    expect(entity.value).toEqual({ url: 'u', assetId: 'a1' });
    // name/id anchor on the first entry (primary).
    expect(entity.name).toBe('cover_url');
  });

  it('onChange commits each input key to its own field', () => {
    const { result } = renderHook(() => useFormApi<CoverValues>(coverConfig()));
    act(() => {
      result.current[1]
        .connectEntity({ url: 'cover_url', assetId: 'cover_id' })
        .onChange?.({ url: 'next-url', assetId: 'next-id' });
    });
    expect(result.current[1].values.cover_url).toBe('next-url');
    expect(result.current[1].values.cover_id).toBe('next-id');
  });

  it('maintains the form scheme — commits per-field, never drops siblings', () => {
    const { result } = renderHook(() =>
      useFormApi<CoverValues>(
        coverConfig({
          initialValues: { cover_url: '', cover_id: '', name: 'keep me' },
        }),
      ),
    );
    act(() => {
      result.current[1]
        .connectEntity({ url: 'cover_url', assetId: 'cover_id' })
        .onChange?.({ url: 'u2', assetId: 'a2' });
    });
    expect(result.current[1].values.cover_url).toBe('u2');
    expect(result.current[1].values.cover_id).toBe('a2');
    // The unmapped sibling field is untouched (scheme preserved).
    expect(result.current[1].values.name).toBe('keep me');
  });

  it('maps to nested paths and preserves their sibling keys', () => {
    interface NestedValues {
      place: { city: string; country: string; lat: number };
    }
    const { result } = renderHook(() =>
      useFormApi<NestedValues>({
        space: 'nested',
        initialValues: { place: { city: '', country: '', lat: 10 } },
      }),
    );
    act(() => {
      result.current[1]
        .connectEntity({ city: 'place/city', country: 'place/country' })
        .onChange?.({ city: 'Munro', country: 'AR' });
    });
    expect(result.current[1].values.place).toEqual({
      city: 'Munro',
      country: 'AR',
      lat: 10, // sibling under the same parent survives
    });
  });

  it('onChange(null) clears every mapped field', () => {
    const { result } = renderHook(() =>
      useFormApi<CoverValues>(
        coverConfig({
          initialValues: { cover_url: 'u', cover_id: 'a1', name: '' },
        }),
      ),
    );
    act(() => {
      result.current[1]
        .connectEntity({ url: 'cover_url', assetId: 'cover_id' })
        .onChange?.(null);
    });
    expect(result.current[1].values.cover_url).toBeUndefined();
    expect(result.current[1].values.cover_id).toBeUndefined();
  });

  it('merges error/touched/focus across fields; error takes the first', () => {
    const { result } = renderHook(() =>
      useFormApi<CoverValues>(
        coverConfig({
          validatorsRules: {
            cover_id: (v: string) => (v ? undefined : 'asset required'),
          },
        }),
      ),
    );
    act(() => {
      result.current[1].validate();
      result.current[1].setBlur('cover_id', false);
    });
    const entity = result.current[1].connectEntity({
      url: 'cover_url',
      assetId: 'cover_id',
    });
    expect(entity.error).toBe('asset required');
    expect(entity.touched).toBe(true);
  });
});
