'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type HTMLProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { buildStyles, type ClassValue } from '@react33/react-styles';
import { Button, Icon } from '@react33/react-ui-base';
import {
  InputFrame,
  InputOptions,
  type InputOptionsDirection,
  moveActiveIndex,
  normalizeActiveIndex,
  pickActiveOption,
  normalizeOptionText,
  readOptionLabel,
  readOptionText,
  resolveOptionsDirection,
  splitInputSegments,
  toOptionArray,
  type FromInputCustomApi,
  type HtmlOmittedProps,
} from '@react33/react-form';

type HtmlInputProps = Omit<HTMLProps<HTMLInputElement>, HtmlOmittedProps>;
type ChipLike = Record<string, unknown> | string | number;

export interface InputChipsProps extends FromInputCustomApi, HtmlInputProps {
  placeholder?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  indicators?: 'off' | 'all';
  focusMode?: 'soft' | 'highLight';
  isClearable?: boolean;
  delimiter?: string;
  mode?: 'free' | 'strict';
  chipName: string;
  chipDisplayName?: string;
  chipBaseAddProps?: Record<string, unknown>;
  options?: ChipLike[];
  encode?: (value: ChipLike[]) => ChipLike[];
  decode?: (value: ChipLike[]) => unknown;
  emptyOptionsLabel?: string;
  keepInputInline?: boolean;
}

const inputChipsStyleMap = {
  root: 'relative w-full',
  content: 'flex min-h-12 w-full min-w-0 flex-wrap items-center',
  chipsContainer: 'flex flex-row flex-wrap gap-2 p-2 pb-0 w-full',
  chipButton: 'border-border-200 font-medium text-text-100',
  input: [
    'min-w-24 flex-1 bg-transparent px-3 py-2 font-medium text-text-200',
    'focus:outline-none focus:shadow-none',
    'disabled:text-disabled-text',
  ],
} as const;

export const inputChipsStyles = buildStyles(inputChipsStyleMap);

const encodeDefault = (value: ChipLike[]) => value;
const decodeDefault = (value: ChipLike[]) => value;

const readChipValue = (candidate: ChipLike, key: string) => {
  return readOptionText(candidate, key);
};

const readChipLabel = (candidate: ChipLike, chipName: string, chipDisplayName?: string) => {
  return readOptionLabel(candidate, chipName, chipDisplayName);
};

export const InputChips = ({
  value,
  focus,
  touched,
  error,
  showError,
  className,
  placeholder = '',
  prefix = null,
  suffix = null,
  disabled = false,
  hidden = false,
  loading = false,
  indicators = 'off',
  focusMode = 'soft',
  isClearable = false,
  delimiter = ',',
  mode = 'free',
  chipName,
  chipDisplayName,
  chipBaseAddProps = {},
  options = [],
  encode = encodeDefault,
  decode = decodeDefault,
  emptyOptionsLabel = 'No options',
  keepInputInline = false,
  onBlur = () => {},
  onFocus = () => {},
  onChange = () => {},
  onKeyDown = () => {},
  ...inputProps
}: InputChipsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const keyboardRemoveEnabledRef = useRef(false);
  const enterHandledInKeyDownRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  const [temp, setTemp] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [optionsDirection, setOptionsDirection] = useState<InputOptionsDirection>('down');
  const [isExpanded, setIsExpanded] = useState(false);

  const allOptions = useMemo(() => toOptionArray<ChipLike>(options), [options]);
  const currentValue = useMemo(() => toOptionArray<ChipLike>(encode(toOptionArray<ChipLike>(value))), [encode, value]);
  const currentValueSet = useMemo(() => {
    return new Set(
      currentValue
        .map((chip) => normalizeOptionText(readChipValue(chip, chipName)))
        .filter(Boolean),
    );
  }, [currentValue, chipName]);

  const query = normalizeOptionText(temp);
  const filteredOptions = useMemo(() => {
    return allOptions.filter((option) => {
      const optionValue = normalizeOptionText(readChipValue(option, chipName));
      if (!optionValue || currentValueSet.has(optionValue)) return false;
      if (!query) return true;
      const displayKey = chipDisplayName ?? chipName;
      const optionLabel = normalizeOptionText(readChipValue(option, displayKey));
      return optionValue.includes(query) || optionLabel.includes(query);
    });
  }, [allOptions, currentValueSet, query, chipName, chipDisplayName]);

  const showFocus = focusMode === 'highLight' && !!focus;
  const showSuccess = indicators === 'all' && !error && !!touched;
  const showIndicators = indicators === 'all' && (showSuccess || !!showError);
  const showOptions = !!focus && isExpanded && !disabled && !loading && allOptions.length > 0;
  const showClear = isClearable && !disabled && !loading && (currentValue.length > 0 || !!temp);
  const isInlineWithChips = keepInputInline && currentValue.length > 0;

  const resolvedStyles = buildStyles({
    root: [inputChipsStyleMap.root, className as ClassValue],
    content: [inputChipsStyleMap.content, keepInputInline && 'gap-2 px-3 py-1'],
    chipsContainer: [inputChipsStyleMap.chipsContainer, keepInputInline && 'w-auto p-0 pb-0'],
    chipButton: inputChipsStyleMap.chipButton,
    input: [inputChipsStyleMap.input, isInlineWithChips && 'px-0'],
  });

  const resetTransientState = () => {
    setTemp('');
    setActiveIndex(-1);
    keyboardRemoveEnabledRef.current = false;
  };

  const publishValue = (nextValue: ChipLike[]) => {
    onChange(decode(nextValue) as never);
  };

  const removeChipAt = (index: number) => {
    const next = currentValue.filter((_, i) => i !== index);
    publishValue(next);
  };

  const appendUnique = (nextItems: ChipLike[]) => {
    if (nextItems.length === 0) return false;
    const next = [...currentValue];
    const localSet = new Set(currentValueSet);
    for (const item of nextItems) {
      const key = normalizeOptionText(readChipValue(item, chipName));
      if (!key || localSet.has(key)) continue;
      localSet.add(key);
      next.push(item);
    }
    if (next.length === currentValue.length) return false;
    publishValue(next);
    return true;
  };

  const commitStrict = (sourceRaw?: string) => {
    const source = (sourceRaw ?? temp ?? '').trim();
    if (!source) return false;
    if (allOptions.length === 0) return false;

    const segments = splitInputSegments(source, delimiter).map(normalizeOptionText);

    if (segments.length === 0) return false;

    const candidates = allOptions.filter((option) => {
      const optionValue = normalizeOptionText(readChipValue(option, chipName));
      if (!optionValue || currentValueSet.has(optionValue)) return false;
      return segments.some((segment) => optionValue.includes(segment));
    });

    const candidate = filteredOptions[activeIndex] ?? candidates[0];
    if (!candidate) return false;
    return appendUnique([candidate]);
  };

  const commitFree = (sourceRaw?: string) => {
    const source = (sourceRaw ?? temp ?? '').trim();
    if (!source) return false;
    const chunks = splitInputSegments(source, delimiter);
    if (chunks.length === 0) return false;

    const resolved = chunks.map((chunk) => {
      const target = normalizeOptionText(chunk);
      const fromOptions = allOptions.find((option) => {
        return normalizeOptionText(readChipValue(option, chipName)) === target;
      });
      if (fromOptions) return fromOptions;
      const nextChip: Record<string, unknown> = { [chipName]: chunk, ...chipBaseAddProps };
      if (chipDisplayName && !nextChip[chipDisplayName]) {
        nextChip[chipDisplayName] = chunk;
      }
      return nextChip;
    });
    return appendUnique(resolved);
  };

  const commitFromInput = (sourceRaw?: string) => {
    const didCommit = mode === 'strict' ? commitStrict(sourceRaw) : commitFree(sourceRaw);
    if (didCommit) {
      resetTransientState();
    }
    return didCommit;
  };

  const commitActiveOption = () => {
    const candidate = pickActiveOption(filteredOptions, activeIndex);
    if (!candidate) return false;
    const didCommit = appendUnique([candidate]);
    if (didCommit) {
      resetTransientState();
    }
    return didCommit;
  };

  const handleClear = () => {
    resetTransientState();
    setIsExpanded(false);
    publishValue([]);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsExpanded(true);
    onFocus();
  };

  const handleContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next && containerRef.current?.contains(next)) return;
    const source = inputRef.current?.value ?? temp;
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
    } else if (source.trim()) {
      commitFromInput(source);
    }
    setIsExpanded(false);
    keyboardRemoveEnabledRef.current = false;
    onBlur();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown(event);

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      const committedFromActive = commitActiveOption();
      if (!committedFromActive) {
        commitFromInput(event.currentTarget.value);
      }
      enterHandledInKeyDownRef.current = true;
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!showOptions) {
        setIsExpanded(true);
        onFocus();
      }
      if (!showOptions || filteredOptions.length === 0) return;
      setActiveIndex((prev) => moveActiveIndex(prev, filteredOptions.length, 'next'));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showOptions || filteredOptions.length === 0) return;
      setActiveIndex((prev) => moveActiveIndex(prev, filteredOptions.length, 'prev'));
      return;
    }

    if (event.key === 'Escape') {
      if (showOptions) {
        event.preventDefault();
        event.stopPropagation();
      }
      setTemp('');
      setActiveIndex(-1);
      setIsExpanded(false);
      onBlur();
      return;
    }

    if (event.key === 'Tab') {
      // Input-level tab: in free mode we commit typed value before moving focus.
      const source = event.currentTarget.value;
      if (mode === 'free' && source.trim()) {
        commitFromInput(source);
      } else {
        skipBlurCommitRef.current = true;
        setTemp('');
        setActiveIndex(-1);
        keyboardRemoveEnabledRef.current = false;
      }
      setIsExpanded(false);
      return;
    }

    if (event.key === 'Backspace' && temp === '' && currentValue.length > 0) {
      if (keyboardRemoveEnabledRef.current) {
        removeChipAt(currentValue.length - 1);
        keyboardRemoveEnabledRef.current = false;
      } else {
        keyboardRemoveEnabledRef.current = true;
      }
      return;
    }

    if (event.key !== 'Backspace') {
      keyboardRemoveEnabledRef.current = false;
    }
  };

  const handleInputKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    if (enterHandledInKeyDownRef.current) {
      enterHandledInKeyDownRef.current = false;
      return;
    }
    // Fallback parity with legacy behavior in cases where keydown is intercepted externally.
    const committedFromActive = commitActiveOption();
    if (!committedFromActive) {
      commitFromInput(event.currentTarget.value);
    }
  };

  useEffect(() => {
    setActiveIndex((prev) => normalizeActiveIndex(prev, filteredOptions.length));
  }, [filteredOptions.length]);

  useEffect(() => {
    if (!showOptions) return;

    const updateDirection = () => {
      setOptionsDirection(resolveOptionsDirection(containerRef.current));
    };

    updateDirection();
    window.addEventListener('resize', updateDirection);
    window.addEventListener('scroll', updateDirection, true);
    return () => {
      window.removeEventListener('resize', updateDirection);
      window.removeEventListener('scroll', updateDirection, true);
    };
  }, [showOptions, filteredOptions.length]);

  useEffect(() => {
    if (focus) return;
    setIsExpanded(false);
    setActiveIndex(-1);
    setTemp('');
  }, [focus]);

  if (hidden) return null;

  const chipsRender = currentValue.length > 0 ? (
    <div className={resolvedStyles.chipsContainer}>
      {currentValue.map((chip, index) => {
        const chipLabel = readChipLabel(chip, chipName, chipDisplayName);
        return (
          <Button
            key={`${readChipValue(chip, chipName)}-${index}`}
            type="button"
            variant="outline"
            size="sm"
            className={resolvedStyles.chipButton}
            data-chip-remove="true"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              // Keyboard-triggered click (Enter/Space) sets detail=0.
              // Mark Enter as handled so input keyup fallback does not re-commit.
              if (event.detail === 0) {
                enterHandledInKeyDownRef.current = true;
              }
              removeChipAt(index);
              inputRef.current?.focus();
            }}
          >
            {chipLabel}
            <Icon name="IconX" size={14} className="text-text-300" />
          </Button>
        );
      })}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={resolvedStyles.root} onBlur={handleContainerBlur}>
      <InputFrame
        focus={!!focus}
        showFocus={showFocus}
        showError={!!showError}
        showSuccess={showSuccess}
        disabled={disabled || loading}
        hasIndicators={showIndicators}
        indicators={indicators}
        prefix={prefix}
        suffix={suffix}
        isClearable={showClear}
        onClear={handleClear}
        clearAriaLabel="Clear chips"
      >
        <div
          className={resolvedStyles.content}
          onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('button[data-chip-remove="true"]')) return;
            onFocus();
            queueMicrotask(() => inputRef.current?.focus());
          }}
        >
          {chipsRender}
          <input
            {...inputProps}
            ref={inputRef}
            value={temp}
            disabled={disabled || loading}
            placeholder={placeholder}
            className={resolvedStyles.input}
            autoComplete="off"
            onFocus={handleFocus}
            onChange={(event) => {
              setTemp(event.target.value);
              setIsExpanded(true);
            }}
            onKeyDown={handleInputKeyDown}
            onKeyUp={handleInputKeyUp}
          />
        </div>
      </InputFrame>
      <InputOptions<ChipLike>
        isOpen={showOptions}
        direction={optionsDirection}
        options={filteredOptions}
        activeIndex={activeIndex}
        emptyLabel={emptyOptionsLabel}
        getOptionKey={(option, index) => `${readChipValue(option, chipName)}-${index}`}
        getOptionLabel={(option) => readChipLabel(option, chipName, chipDisplayName)}
        onHoverIndexChange={setActiveIndex}
        onSelect={(option) => {
          const didCommit = appendUnique([option]);
          if (didCommit) {
            setTemp('');
            setIsExpanded(false);
          }
          queueMicrotask(() => inputRef.current?.focus());
        }}
        onOptionKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          event.preventDefault();
          event.stopPropagation();
          setIsExpanded(false);
          setActiveIndex(-1);
          setTemp('');
          skipBlurCommitRef.current = true;
          queueMicrotask(() => inputRef.current?.focus());
        }}
      />
    </div>
  );
};

InputChips.displayName = 'InputChips';
