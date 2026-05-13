'use client';

import { type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { buildStyles, type ClassValue } from '@maurotaliente/react-styles';
import { Button, Icon } from '@maurotaliente/react-ui-base';

export interface InputFrameProps {
  className?: ClassValue;
  contentClassName?: ClassValue;
  rightActionsClassName?: ClassValue;
  indicatorsClassName?: ClassValue;
  focus?: boolean;
  showFocus?: boolean;
  showError?: boolean;
  showSuccess?: boolean;
  disabled?: boolean;
  overflowHidden?: boolean;
  hasIndicators?: boolean;
  children?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  isClearable?: boolean;
  onClear?: () => void;
  clearAriaLabel?: string;
  rightActions?: ReactNode;
  indicators?: 'off' | 'all';
}

export const InputFrame = ({
  className,
  contentClassName,
  rightActionsClassName,
  indicatorsClassName,
  focus = false,
  showFocus = false,
  showError = false,
  showSuccess = false,
  disabled = false,
  overflowHidden = false,
  hasIndicators = false,
  children,
  prefix,
  suffix,
  isClearable = false,
  onClear,
  clearAriaLabel = 'Clear',
  rightActions,
  indicators,
}: InputFrameProps) => {
  const showClearButton = isClearable && !!onClear;
  const showIndicators = indicators === 'all' && (showSuccess || showError);
  const shiftRightActions = hasIndicators || showIndicators;

  const handleClear = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClear?.();
  };

  const resolvedStyles = buildStyles({
    container: [
      'relative flex items-center w-full bg-bg-100 border border-border-200 rounded-md',
      className,
      focus && 'border-border-100 ring-2 ring-graysc-300/50',
      showFocus && 'border-accent-100 ring-2 ring-accent-200/50',
      showSuccess && 'border-positive-100 ring-2 ring-positive-200/50',
      showError && 'border-negative-100 ring-2 ring-negative-200/50',
      disabled && 'border-disabled-border cursor-not-allowed',
      overflowHidden && 'overflow-hidden',
    ],
    content: ['relative flex flex-1 w-full min-w-0', contentClassName],
    rightActions: [
      'absolute right-1 top-[0.8rem] z-[1] flex items-center gap-1 transition-[right] duration-300 ease-in-out',
      shiftRightActions && 'right-8',
      rightActionsClassName,
    ],
    indicators: ['pointer-events-none absolute right-2 top-[0.6125rem] z-[2]', indicatorsClassName],
    indicator: [
      'flex',
      disabled && 'text-text-100',
      showSuccess && 'text-positive-100',
      showError && 'text-negative-100',
    ],
    clearButton: [
      'flex h-auto appearance-none focus:outline-none focus:shadow-none',
      'text-text-300 focus:text-text-100',
    ],
  });

  return (
    <div className={resolvedStyles.container}>
      {prefix}
      <div className={resolvedStyles.content}>{children}</div>
      {suffix}
      {showClearButton || rightActions ? (
        <div className={resolvedStyles.rightActions}>
          {showClearButton ? (
            <Button
              type="button"
              variant="text"
              size="icon-sm"
              className={resolvedStyles.clearButton}
              onClick={handleClear}
              aria-label={clearAriaLabel}
            >
              <Icon name="IconX" size={22} />
            </Button>
          ) : null}
          {rightActions}
        </div>
      ) : null}
      {showIndicators ? (
        <div className={resolvedStyles.indicators}>
          <div className={resolvedStyles.indicator}>
            <Icon
              name={showError ? 'IconExclamationCircleFilled' : 'IconCircleCheckFilled'}
              size={28}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

InputFrame.displayName = 'InputFrame';
