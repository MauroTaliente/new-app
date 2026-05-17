'use client';

import { forwardRef, useState, type ForwardedRef } from 'react';
import { newContext } from '@react33/react-context';
import { useIsomorphicLayoutEffect } from '@react33/react-hooks';
import { isFunction } from '@react33/react-helpers';
import {
  useFormApi,
  type FormApi,
  type FormProps,
  type ForwardForm,
  type HTMLFormElementExtended,
  type Values,
} from './use-form-api';

const formsContext = newContext({
  name: 'forms',
  initValues: {} as { [key: string]: FormApi | undefined },
  reducer: (acc: { [key: string]: FormApi | undefined }, cur: { [key: string]: FormApi | undefined }) => ({
    ...acc,
    ...cur,
  }),
});

const FormsProvider = formsContext.FormsProvider;
const useFormsState = formsContext.useFormsState;
const useFormsUpdater = formsContext.useFormsUpdater;

export const useFormState = <T extends Values = Values>(name: string): FormApi<T> => {
  const bag = useFormsState();
  const api = bag?.[name] || bag?.anonymous;
  if (!api) throw new Error(`Form with name "${name || 'anonymous'}" not found in context`);
  return api as FormApi<T>;
};

const FormRegister = forwardRef<HTMLFormElementExtended, FormProps>(function FormRegisterInner<
  T extends Values = Values,
>(
  { config, children, ...formProps }: FormProps<T>,
  ref: ForwardedRef<HTMLFormElementExtended<T>>,
) {
  const [formRef, api] = useFormApi(config, ref);
  const register = useFormsUpdater();
  const [registered, setRegistered] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const key = config.space || 'anonymous';
    register({ [key]: api });
    setRegistered(true);
    return () => {
      register({ [key]: undefined });
      setRegistered(false);
    };
  }, [api, config.space, register]);

  const render = registered ? (isFunction(children) ? children(api) : children) : null;

  return (
    <form
      ref={formRef}
      {...formProps}
      onSubmit={api.nativeSubmit}
      onReset={api.formReset}
    >
      {render}
    </form>
  );
});

/** Wraps the tree with a forms registry so `useFormState(space)` can resolve the matching `Form` API. */
const FormProviderBase = forwardRef<HTMLFormElementExtended, FormProps>(function FormProviderInner<
  T extends Values = Values,
>(
  formProps: FormProps<T>,
  ref: ForwardedRef<HTMLFormElementExtended<T>>,
) {
  return (
    <FormsProvider>
      <FormRegister {...formProps} ref={ref} />
    </FormsProvider>
  );
});

FormProviderBase.displayName = 'FormProvider';

export const FormProvider = FormProviderBase as ForwardForm;

FormRegister.displayName = 'FormRegister';
