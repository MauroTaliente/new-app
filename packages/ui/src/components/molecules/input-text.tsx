'use client';

import {
  useState,
  useRef,
  forwardRef,
  useEffect,
  type ChangeEvent,
  type HTMLProps,
  type ReactNode,
  type KeyboardEvent,
  type RefObject,
  type Ref,
} from 'react';
import { buildStyles, type ClassValue } from '@maurotaliente/react-styles';
import { Button, Icon } from '@maurotaliente/react-ui-base';
import {
  InputFrame,
  type FromInputCustomApi,
  type HtmlOmittedProps,
} from '@maurotaliente/react-form';

export type HTMLComboElement = HTMLInputElement & HTMLTextAreaElement;

type HtmlInputTextProps = Omit<HTMLProps<HTMLComboElement>, HtmlOmittedProps>;

export interface InputTextProps extends FromInputCustomApi, HtmlInputTextProps {
  placeholder?: string;
  disclaimer?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  disabled?: boolean;
  preventEnterSendForm?: boolean;
  indicators?: 'off' | 'all';
  hidden?: boolean;
  loading?: boolean;
  isClearable?: boolean;
  /** Legacy prop (unused in styles; reserved for future parity). */
  hightLight?: boolean;
  highlight?: boolean;
  mode?: 'area' | 'text';
  focusMode?: 'soft' | 'highLight';
  onPressEnter?: (value: string) => void;
  onPressBack?: (value: string) => void;
  encode?: (value: unknown) => string;
  decode?: (value: string) => unknown;
}

const encodeDefault = (value: unknown) => String(value ?? '');

const decodeDefault = (value: string) => value;

export const InputText = forwardRef<HTMLComboElement, InputTextProps>(function InputText(
  {
    type,
    value,
    focus,
    touched,
    error,
    showError,
    mode = 'text',
    focusMode = 'soft',
    placeholder = '',
    className,
    prefix = null,
    suffix = null,
    loading = false,
    hidden: _hidden = false,
    disabled = false,
    indicators = 'off',
    required = false,
    isClearable = false,
    preventEnterSendForm = false,
    encode = encodeDefault,
    decode = decodeDefault,
    onBlur = () => {},
    onFocus = () => {},
    onChange = () => {},
    onPressEnter = () => {},
    onPressBack = () => {},
    onKeyDown = () => {},
    hightLight: _hightLightLegacy,
    highlight: _highlightProp,
    ...inputProps
  },
  receivedRef: Ref<HTMLComboElement>,
) {
  const innerRef = useRef<HTMLComboElement>(null);
  const ref = (receivedRef ?? innerRef) as RefObject<HTMLComboElement>;
  const [togType, setTogType] = useState(type);

  const isText = mode === 'text';
  const isPasswordType = type === 'password' || type === 'new-password';
  const isPrivated = togType === 'password' || togType === 'new-password';

  const displayValue = encode(value ?? '');
  const showClean = isClearable && !!displayValue && !disabled && !loading && !isPrivated;
  const showEye = !disabled && !loading && isPasswordType;
  const showFocus = focusMode === 'highLight' && focus;
  const showSuccess = indicators === 'all' && !error && touched;
  const showIndicators = indicators === 'all' && (showSuccess || showError);
  const showButtons = showClean || showEye;

  const handleFocus = () => {
    onFocus();
  };

  const handleBlur = () => {
    onBlur();
  };

  const handleChange = (event: ChangeEvent<HTMLComboElement>) => {
    const decoded = decode(event.target.value);
    onChange(decoded as never);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLComboElement>) => {
    onKeyDown(event);
    const { key, currentTarget } = event;

    if (key === 'Enter') {
      if (preventEnterSendForm) {
        event.preventDefault();
        event.stopPropagation();
      }
      const decoded = decode(currentTarget.value);
      onChange(decoded as never);
      onPressEnter(String(decoded ?? ''));
    }

    if (key === 'Backspace') {
      const decoded = decode(currentTarget.value);
      onPressBack(String(decoded ?? ''));
    }
  };

  const handleClean = () => {
    onChange('' as never);
    ref.current?.focus();
  };

  const handlePrivacy = () => {
    setTogType((pre) => (pre !== type ? type! : 'text'));
  };

  useEffect(() => {
    if (mode === 'area' && ref.current) {
      const el = ref.current;
      const resize = () => {
        el.style.height = 'auto';
        const height = Math.min(el.scrollHeight, 256);
        el.style.height = `${height}px`;
      };
      resize();
    }
  }, [displayValue, mode]);

  const resolvedStyles = buildStyles({
    input: [
      'block w-full p-3 bg-bg-100 text-text-200 rounded-md',
      'appearance-none focus:outline-none focus:shadow-none',
      'autofill:bg-bg-200',
      disabled && 'bg-disabled-bg text-disabled-text',
      (showButtons || showIndicators) && 'pr-10',
      showButtons && showIndicators && 'pr-18',
    ],
    button: [
      'flex',
      'h-auto appearance-none focus:outline-none focus:shadow-none',
      'text-text-300 focus:text-text-100',
      disabled && 'text-disabled-text cursor-not-allowed',
      showIndicators && 'focus:bg-gradient-to-r focus:from-glass-bg-300 focus:to-transparent',
    ],
  });

  const commonInputProps = {
    className: resolvedStyles.input,
    ref,
    value: displayValue,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    disabled,
    required,
    placeholder,
    ...inputProps,
  };

  return (
    <InputFrame
      className={className as ClassValue}
      focus={!!focus}
      showFocus={showFocus}
      showError={!!showError}
      showSuccess={showSuccess}
      disabled={disabled}
      overflowHidden={showButtons}
      hasIndicators={showIndicators}
      prefix={prefix}
      suffix={suffix}
      isClearable={showClean}
      onClear={handleClean}
      clearAriaLabel="Clear"
      indicators={indicators}
      rightActions={
        showEye ? (
          <Button
            type="button"
            variant="text"
            size="icon-sm"
            className={resolvedStyles.button}
            disabled={disabled || loading}
            onClick={handlePrivacy}
            aria-label={isPrivated ? 'Show password' : 'Hide password'}
          >
            <Icon name={isPrivated ? 'IconEyeClosed' : 'IconEye'} size={22} />
          </Button>
        ) : null
      }
    >
      {isText ? (
        <input type={togType} {...commonInputProps} />
      ) : (
        <textarea {...commonInputProps} />
      )}
    </InputFrame>
  );
});

InputText.displayName = 'InputText';
