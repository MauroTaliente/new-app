'use client';

import {
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { buildStyles } from '@maurotaliente/react-styles';
import { isArray, isObject } from '@maurotaliente/react-helpers';
import { Overlay } from '@maurotaliente/react-ui-base';
import type { FormInputApi } from '../organisms/form/use-form-api';

export interface FieldProps extends FormInputApi {
  label?: string;
  disclaimer?: string;
  loading?: boolean;
  required?: boolean;
  children: ReactNode;
  errorMode?: 'inline' | 'floating';
  disabled?: boolean;
}

export type FieldPropsExtended<TProps extends object = Record<string, never>> = FieldProps & TProps;

export function Field<TProps extends object = Record<string, never>>({
  space: _space,
  name,
  error,
  showError,
  loading,
  label,
  disclaimer,
  required,
  children,
  errorMode = 'inline',
  disabled,
  id,
  ...props
}: FieldPropsExtended<TProps>) {
  const getCompose = (child: ReactNode): ReactNode => {
    if (!isValidElement(child)) return child;
    const inheritProps: Record<string, unknown> = {
      'aria-invalid': showError ? true : undefined,
      showError,
      error,
      disabled,
      loading,
      required,
      ...props,
    };
    const childProps = isObject(child.props) ? child.props : {};
    const composedProps = { ...inheritProps, ...childProps };
    return cloneElement(child as ReactElement, composedProps);
  };

  const childrenReady = isArray(children)
    ? children.map((child, i) => (
        <Fragment key={`${String(name)}-child-${i}`}>{getCompose(child)}</Fragment>
      ))
    : getCompose(children);

  const resolvedStyles = buildStyles({
    container: 'flex flex-col gap-3 w-full relative',
    content: 'flex flex-col items-start rounded-md relative gap-space-sm',
    label: ['text-text-200 font-medium', disabled && 'text-disabled-text'],
    error: [
      'text-xs text-negative-100 w-full pl-2',
      errorMode === 'floating' && 'absolute left-0 top-full pt-2',
    ],
    disclaimer: 'text-xs text-text-300',
  });

  const labelFor = id ?? name;

  return (
    <div data-field={name} className={resolvedStyles.container}>
      {label ? (
        <label htmlFor={labelFor} className={resolvedStyles.label}>
          {label} {required ? <span className="text-negative-100">*</span> : null}
        </label>
      ) : null}
      <Overlay className={resolvedStyles.content} active={!!loading}>
        {childrenReady}
      </Overlay>
      {showError ? <div className={resolvedStyles.error}>{error}</div> : null}
      {disclaimer ? <div className={resolvedStyles.disclaimer}>{disclaimer}</div> : null}
    </div>
  );
}
