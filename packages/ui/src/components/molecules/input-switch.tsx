'use client';

import {
  forwardRef,
  useMemo,
  useRef,
  type ForwardedRef,
  type HTMLProps,
  type ReactNode,
  type RefObject,
} from 'react';
import { buildStyles } from '@maurotaliente/react-styles';
import type { FromInputCustomApi, HtmlOmittedProps } from '@maurotaliente/react-form';

type HtmlInputSwitchProps = Omit<HTMLProps<HTMLDivElement>, HtmlOmittedProps>;
type SwitchValue = boolean | string | number | null;

const inputSwitchStyleMap = {
  container: 'flex flex-row items-center justify-center gap-2 px-3 py-2.75',
  markedArea: 'justify-start rounded-md border border-border-200 bg-bg-100 px-4',
  switchBox: [
    'relative inline-flex h-6 w-11 items-center rounded-full border border-transparent',
    'outline-none transition-colors',
    'focus-visible:ring-2 focus-visible:ring-accent-200/50',
    'disabled:cursor-not-allowed',
    'cursor-pointer',
  ],
  thumb: [
    'h-5 w-5 rounded-full bg-bg-100 shadow-sm transition-transform duration-200',
    'border border-border-200',
  ],
  state: {
    on: {
      neutral: 'bg-graysc-100',
      violete: 'bg-context-200',
      yellow: 'bg-note-200',
      orange: 'bg-advice-200',
      blue: 'bg-accent-200',
      green: 'bg-positive-200',
      red: 'bg-negative-200',
      disabled: 'bg-disabled-bg',
    },
    off: {
      neutral: 'bg-graysc-300',
      violete: 'bg-context-300',
      yellow: 'bg-note-300',
      orange: 'bg-advice-300',
      blue: 'bg-accent-300',
      green: 'bg-positive-300',
      red: 'bg-negative-300',
      disabled: 'bg-disabled-bg',
    },
  },
} as const;

export type InputSwitchColor = keyof typeof inputSwitchStyleMap.state.on;

export interface InputSwitchProps extends FromInputCustomApi, HtmlInputSwitchProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  mode?: 'clean' | 'marked';
  defaultValue?: SwitchValue;
  oppoValue?: SwitchValue;
  color?: InputSwitchColor;
  focusMode?: 'soft' | 'highLight';
}

export const InputSwitch = forwardRef<HTMLDivElement, InputSwitchProps>(
  (
    {
      value = null,
      focus = false,
      touched: _touched,
      error,
      showError: _showError,
      className,
      loading = false,
      disabled = false,
      hidden = false,
      defaultValue,
      oppoValue,
      color = 'neutral',
      prefix = null,
      suffix = null,
      mode = 'clean',
      focusMode = 'soft',
      onBlur = () => {},
      onFocus = () => {},
      onChange = () => {},
      ...inputProps
    },
    receivedRef: ForwardedRef<HTMLDivElement>,
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const ref = (receivedRef || innerRef) as RefObject<HTMLDivElement>;

    const boolValue = useMemo(() => {
      if (defaultValue === undefined && oppoValue === undefined) return !!value;
      if (defaultValue !== undefined && oppoValue !== undefined) return value === oppoValue;
      if (oppoValue !== undefined) return value === oppoValue;
      return false;
    }, [value, defaultValue, oppoValue]);

    const computeNextValue = (): SwitchValue => {
      if (defaultValue !== undefined && oppoValue !== undefined) {
        return boolValue ? (defaultValue ?? null) : (oppoValue ?? null);
      }
      if (oppoValue !== undefined) {
        return boolValue ? (value as SwitchValue) : oppoValue;
      }
      return !boolValue;
    };

    const handleToggle = () => {
      if (disabled || loading) return;
      const next = computeNextValue();
      onChange(next as never);
    };

    const showMarkedArea = mode === 'marked';
    const showFocus = focusMode === 'highLight' && !!focus;
    const stateColor = disabled
      ? inputSwitchStyleMap.state.on.disabled
      : boolValue
        ? inputSwitchStyleMap.state.on[color]
        : inputSwitchStyleMap.state.off[color];

    const resolvedStyles = buildStyles({
      container: [
        inputSwitchStyleMap.container,
        showMarkedArea && inputSwitchStyleMap.markedArea,
        showFocus && 'border-accent-100 ring-2 ring-accent-200/50',
        className,
      ],
      switchBox: [inputSwitchStyleMap.switchBox, stateColor],
      thumb: [inputSwitchStyleMap.thumb, boolValue ? 'translate-x-5' : 'translate-x-0.5'],
      label: 'text-text-200 font-medium',
    });

    if (hidden) return null;

    return (
      <div className={resolvedStyles.container} {...inputProps}>
        {prefix ? <div className={resolvedStyles.label}>{prefix}</div> : null}
        <div
          ref={ref}
          role="switch"
          aria-checked={boolValue}
          aria-invalid={!!error}
          aria-disabled={disabled || loading}
          tabIndex={disabled ? -1 : 0}
          className={resolvedStyles.switchBox}
          onClick={handleToggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleToggle();
            }
          }}
          onFocus={() => onFocus()}
          onBlur={() => onBlur()}
        >
          <span className={resolvedStyles.thumb} aria-hidden />
        </div>
        {suffix ? <div className={resolvedStyles.label}>{suffix}</div> : null}
      </div>
    );
  },
);

InputSwitch.displayName = 'InputSwitch';
