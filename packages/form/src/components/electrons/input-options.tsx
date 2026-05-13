'use client';

import { type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { buildStyles, type ClassValue } from '@maurotaliente/react-styles';

export type InputOptionsDirection = 'up' | 'down';
export type OptionMoveDirection = 'next' | 'prev';

export const normalizeActiveIndex = (activeIndex: number, optionsLength: number) => {
  if (optionsLength <= 0) return -1;
  if (activeIndex < 0) return 0;
  if (activeIndex >= optionsLength) return optionsLength - 1;
  return activeIndex;
};

export const moveActiveIndex = (
  activeIndex: number,
  optionsLength: number,
  direction: OptionMoveDirection,
) => {
  if (optionsLength <= 0) return -1;
  if (direction === 'next') {
    if (activeIndex >= optionsLength - 1) return 0;
    return activeIndex + 1;
  }
  if (activeIndex <= 0) return optionsLength - 1;
  return activeIndex - 1;
};

export const pickActiveOption = <TOption,>(options: TOption[], activeIndex: number) => {
  if (options.length === 0) return undefined;
  const normalized = normalizeActiveIndex(activeIndex, options.length);
  if (normalized < 0) return undefined;
  return options[normalized];
};

export const splitInputSegments = (source: string, delimiter = ',') => {
  const base = (source ?? '').trim();
  if (!base) return [];
  return base
    .split(delimiter || ',')
    .map((part) => part.trim())
    .filter(Boolean);
};

export const toOptionArray = <TOption,>(value: unknown): TOption[] => (
  Array.isArray(value) ? (value as TOption[]) : []
);

export const toOptionText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  return '';
};

export const readOptionText = (candidate: unknown, key: string) => {
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    return toOptionText((candidate as Record<string, unknown>)[key]);
  }
  return toOptionText(candidate);
};

export const readOptionLabel = (candidate: unknown, optionName: string, optionDisplayName?: string) => {
  if (!optionDisplayName) return readOptionText(candidate, optionName);
  const display = readOptionText(candidate, optionDisplayName);
  if (display) return display;
  return readOptionText(candidate, optionName);
};

export const normalizeOptionText = (value: string) => value.trim().toLowerCase();

export const resolveOptionsDirection = (
  element: HTMLElement | null,
  estimatedListHeight = 280,
): InputOptionsDirection => {
  const inputRect = element?.getBoundingClientRect();
  if (!inputRect) return 'down';
  const spaceBelow = window.innerHeight - inputRect.bottom;
  return spaceBelow < estimatedListHeight ? 'up' : 'down';
};

export interface InputOptionsProps<TOption = unknown> {
  className?: ClassValue;
  optionClassName?: ClassValue;
  isOpen?: boolean;
  direction?: InputOptionsDirection;
  options: TOption[];
  activeIndex?: number;
  emptyLabel?: string;
  getOptionKey: (option: TOption, index: number) => string;
  getOptionLabel: (option: TOption, index: number) => string;
  isOptionSelected?: (option: TOption, index: number) => boolean;
  onSelect?: (option: TOption, index: number) => void;
  onHoverIndexChange?: (index: number) => void;
  onOptionKeyDown?: (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    option: TOption,
    index: number,
  ) => void;
}

const inputOptionsStyleMap = {
  container: [
    'absolute left-0 right-0 z-20 max-h-64 overflow-y-auto rounded-md border border-border-200 bg-bg-100 py-1 shadow-lg',
    'transition-opacity duration-150 ease-in-out',
  ],
  openState: {
    open: 'opacity-100',
    closed: 'pointer-events-none opacity-0',
  },
  direction: {
    up: 'bottom-full mb-2',
    down: 'top-full mt-2',
  },
  option: [
    'w-full px-3 py-2 text-left text-sm text-text-200 transition-colors',
    'focus:outline-none focus:bg-bg-300 hover:bg-bg-300',
  ],
  optionState: {
    active: 'bg-bg-300',
    selected: 'text-accent-100',
    idle: '',
  },
  empty: 'px-3 py-2 text-sm text-text-300',
} as const;

export const inputOptionsStyles = buildStyles(inputOptionsStyleMap);

export function InputOptions<TOption = unknown>({
  className,
  optionClassName,
  isOpen = false,
  direction = 'down',
  options,
  activeIndex = -1,
  emptyLabel = 'No options',
  getOptionKey,
  getOptionLabel,
  isOptionSelected = () => false,
  onSelect,
  onHoverIndexChange,
  onOptionKeyDown,
}: InputOptionsProps<TOption>) {
  const showEmpty = isOpen && options.length === 0;
  const resolvedStyles = buildStyles({
    container: [
      inputOptionsStyles.container,
      inputOptionsStyles.direction[direction],
      isOpen ? inputOptionsStyles.openState.open : inputOptionsStyles.openState.closed,
      className,
    ],
    option: [
      inputOptionsStyles.option,
      optionClassName,
    ],
  });

  return (
    <div className={resolvedStyles.container} role="listbox" aria-hidden={!isOpen}>
      {showEmpty ? <div className={inputOptionsStyles.empty}>{emptyLabel}</div> : null}
      {isOpen
        ? options.map((option, index) => {
          const isActive = activeIndex === index;
          const isSelected = isOptionSelected(option, index);
          return (
            <button
              key={getOptionKey(option, index)}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={buildStyles({
                root: [
                  resolvedStyles.option,
                  isActive && inputOptionsStyles.optionState.active,
                  isSelected && inputOptionsStyles.optionState.selected,
                  !isActive && !isSelected && inputOptionsStyles.optionState.idle,
                ],
              }).root}
              onMouseEnter={() => onHoverIndexChange?.(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelect?.(option, index);
              }}
              onKeyDown={(event) => {
                onOptionKeyDown?.(event, option, index);
                if (event.defaultPrevented) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelect?.(option, index);
                }
              }}
            >
              {getOptionLabel(option, index)}
            </button>
          );
        })
        : null}
    </div>
  );
}

InputOptions.displayName = 'InputOptions';
