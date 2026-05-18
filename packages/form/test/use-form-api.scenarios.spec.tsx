import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ChangeEvent } from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { getValueFromPath } from '@react33/react-helpers';
import { HttpCode } from '@react33/react-networking';
import { Form } from '../src/components/organisms/form/form';
import {
  getUID,
  useFormApi,
  type FormConfig,
} from '../src/components/organisms/form/use-form-api';

interface ProfileValues {
  email: string;
  agree: boolean;
  user: { name: string };
}

const profileConfig = (
  overrides: Partial<FormConfig<ProfileValues>> = {},
): FormConfig<ProfileValues> => ({
  space: 'profile',
  initialValues: { email: '', agree: false, user: { name: '' } },
  ...overrides,
});

describe('useFormApi scenarios', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('getUID composes space and field name', () => {
    expect(getUID('signup', 'email')).toBe('signup-email');
    expect(getUID(undefined, 'email')).toBe('unknownemail');
  });

  it('connect exposes showError only when touched, invalid, and not focused', () => {
    const { result } = renderHook(() =>
      useFormApi<ProfileValues>(
        profileConfig({
          validatorsRules: {
            email: (v: string) => (v ? undefined : 'required'),
          },
        }),
      ),
    );
    const api = () => result.current[1];

    act(() => api().setBlur('email', false));
    expect(api().connect('email').showError).toBe(true);

    act(() => api().setFocus('email', true));
    expect(api().connect('email').showError).toBe(false);
  });

  it('setValue on nested path updates nested values', () => {
    const { result } = renderHook(() => useFormApi<ProfileValues>(profileConfig()));
    act(() => result.current[1].setValue('user/name', 'Ada'));
    expect(getValueFromPath('user/name', result.current[1].values)).toBe('Ada');
  });

  it('undo and redo traverse history when undoLimit > 0', () => {
    const { result } = renderHook(() =>
      useFormApi<ProfileValues>(
        profileConfig({
          initialValues: { email: 'a', agree: false, user: { name: '' } },
          undoLimit: 5,
        }),
      ),
    );
    const api = () => result.current[1];

    act(() => api().setValue('email', 'b', 'edit'));
    act(() => api().setValue('email', 'c', 'edit'));
    act(() => api().undo());
    expect(api().values.email).toBe('b');
    act(() => api().redo());
    expect(api().values.email).toBe('c');
  });

  it('onChange receives api with updated values when Form is mounted', async () => {
    const onChange = vi.fn();
    render(
      <Form config={profileConfig({ onChange })}>
        {(api) => (
          <button type="button" data-testid="set" onClick={() => api.setValue('email', 'x@y.com')}>
            set
          </button>
        )}
      </Form>,
    );

    fireEvent.click(screen.getByTestId('set'));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls.some((call) => call[0].values.email === 'x@y.com')).toBe(true);
    });
  });

  it('connectNative updates form values from DOM change events', async () => {
    let capturedApi: ReturnType<typeof useFormApi<ProfileValues>>[1] | undefined;

    render(
      <Form config={profileConfig()}>
        {(api) => {
          capturedApi = api;
          const native = api.connectNative('email');
          return (
            <input
              data-testid="email-native"
              name="email"
              value={native.value ?? ''}
              onChange={native.onChange}
            />
          );
        }}
      </Form>,
    );

    fireEvent.change(screen.getByTestId('email-native'), {
      target: { name: 'email', value: 'native@test.com' },
    });

    await waitFor(() => expect(capturedApi?.values.email).toBe('native@test.com'));
  });

  it('onLazyChange fires after debounce when configured', async () => {
    vi.useFakeTimers();
    const onLazyChange = vi.fn();
    render(
      <Form
        config={profileConfig({
          onLazyChange,
          lazyDelayMs: 200,
          lazyTickMs: 50,
        })}
      >
        {(api) => (
          <button type="button" data-testid="edit" onClick={() => api.setValue('email', 'lazy@test.com')}>
            edit
          </button>
        )}
      </Form>,
    );

    fireEvent.click(screen.getByTestId('edit'));
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(onLazyChange).toHaveBeenCalled();
    expect(onLazyChange.mock.calls.at(-1)?.[0].values.email).toBe('lazy@test.com');
  });

  it('onReady runs once when Form mounts', async () => {
    const onReady = vi.fn();
    render(
      <Form config={profileConfig({ onReady })}>
        <span>child</span>
      </Form>,
    );
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
  });

  it('setNativeValue handles checkbox inputs', () => {
    const { result } = renderHook(() => useFormApi<ProfileValues>(profileConfig()));
    act(() => {
      result.current[1].setNativeValue({
        target: { name: 'agree', type: 'checkbox', checked: true },
      } as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current[1].values.agree).toBe(true);
  });

  it('formReset invokes onReset when mounted in Form', async () => {
    const onReset = vi.fn();
    const { container } = render(
      <Form
        config={profileConfig({
          initialValues: { email: 'a@b.com', agree: false, user: { name: '' } },
          onReset,
        })}
      >
        {(api) => (
          <button type="button" data-testid="touch" onClick={() => api.setValue('email', 'changed')}>
            touch
          </button>
        )}
      </Form>,
    );

    fireEvent.click(screen.getByTestId('touch'));
    fireEvent.reset(container.querySelector('form')!);
    await waitFor(() => expect(onReset).toHaveBeenCalled());
  });

  it('syncInitialValues applies external initialValues updates', async () => {
    const { result, rerender } = renderHook(
      ({ email }: { email: string }) =>
        useFormApi<ProfileValues>(
          profileConfig({
            syncInitialValues: true,
            initialValues: { email, agree: false, user: { name: '' } },
          }),
        ),
      { initialProps: { email: 'first@test.com' } },
    );

    await waitFor(() => expect(result.current[1].values.email).toBe('first@test.com'));
    rerender({ email: 'second@test.com' });
    await waitFor(() => expect(result.current[1].values.email).toBe('second@test.com'));
  });

  it('resets values from emptyValues when request status becomes OK', async () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: HttpCode }) =>
        useFormApi<ProfileValues>(
          profileConfig({
            initialValues: { email: 'dirty', agree: false, user: { name: '' } },
            emptyValues: { email: '', agree: false, user: { name: '' } },
            status,
          }),
        ),
      { initialProps: { status: HttpCode.BEGGINNING } },
    );

    await waitFor(() => expect(result.current[1].values.email).toBe('dirty'));
    rerender({ status: HttpCode.OK });
    await waitFor(() => expect(result.current[1].values.email).toBe(''));
  });

  it('resets values but keeps messages when request status becomes ACCEPTED (202)', async () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: HttpCode }) =>
        useFormApi<ProfileValues>(
          profileConfig({
            initialValues: { email: 'dirty', agree: false, user: { name: '' } },
            emptyValues: { email: '', agree: false, user: { name: '' } },
            status,
          }),
        ),
      { initialProps: { status: HttpCode.BEGGINNING } },
    );

    act(() => result.current[1].setMessage('email', 'server rejected'));
    expect(result.current[1].messages).toEqual({ email: 'server rejected' });

    rerender({ status: HttpCode.ACCEPTED });
    await waitFor(() => {
      expect(result.current[1].values.email).toBe('');
      expect(result.current[1].messages).toEqual({ email: 'server rejected' });
    });
  });

  it('latches statusError from statusErrors and keeps it when status returns to 0', async () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: HttpCode }) =>
        useFormApi<ProfileValues>(
          profileConfig({
            status,
            statusErrors: {
              [HttpCode.UNPROCESSABLE_ENTITY]: 'Datos inválidos',
            },
          }),
        ),
      { initialProps: { status: HttpCode.BEGGINNING } },
    );

    rerender({ status: HttpCode.UNPROCESSABLE_ENTITY });
    await waitFor(() => {
      expect(result.current[1].lastStatus).toBe(HttpCode.UNPROCESSABLE_ENTITY);
      expect(result.current[1].statusError).toBe('Datos inválidos');
    });

    rerender({ status: HttpCode.BEGGINNING });
    await waitFor(() => {
      expect(result.current[1].lastStatus).toBe(HttpCode.UNPROCESSABLE_ENTITY);
      expect(result.current[1].statusError).toBe('Datos inválidos');
    });
  });

  it('clears statusError latch on submit', async () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: HttpCode }) =>
        useFormApi<ProfileValues>(
          profileConfig({
            initialValues: { email: 'ok@test.com', agree: false, user: { name: '' } },
            status,
            statusErrors: {
              [HttpCode.INTERNAL_SERVER_ERROR]: 'Error del servidor',
            },
          }),
        ),
      { initialProps: { status: HttpCode.INTERNAL_SERVER_ERROR } },
    );

    await waitFor(() => expect(result.current[1].statusError).toBe('Error del servidor'));

    act(() => {
      result.current[1].submit(document.createElement('form'), 'unit');
    });

    expect(result.current[1].statusError).toBeNull();
    expect(result.current[1].lastStatus).toBe(HttpCode.BEGGINNING);

    rerender({ status: HttpCode.BEGGINNING });
    expect(result.current[1].statusError).toBeNull();
  });

  it('validate surfaces errors after blur', () => {
    const { result } = renderHook(() =>
      useFormApi<ProfileValues>(
        profileConfig({
          validatorsRules: {
            email: (v: string) => (v ? undefined : 'required'),
          },
        }),
      ),
    );

    act(() => result.current[1].setBlur('email', false));
    expect(result.current[1].connect('email').error).toBe('required');
  });
});
