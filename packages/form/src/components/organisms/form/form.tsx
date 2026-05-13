'use client';

import { forwardRef, type ForwardedRef, type JSX, type RefAttributes } from 'react';
import { isFunction } from '@react33/react-helpers';
import {
  useFormApi,
  type FormProps,
  type HTMLFormElementExtended,
  type Values,
} from './use-form-api';

function FormInner<T extends Values>(
  { config, children, ...formProps }: FormProps<T>,
  ref: ForwardedRef<HTMLFormElementExtended<T>>,
): JSX.Element {
  const [formRef, api] = useFormApi(config, ref);
  const render = isFunction(children) ? children(api) : children;

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
}

const FormBase = forwardRef(FormInner);
FormBase.displayName = 'Form';

export const Form = FormBase as <T extends Values = Values>(
  props: FormProps<T> & RefAttributes<HTMLFormElementExtended<T>>,
) => JSX.Element;
