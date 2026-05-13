'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type HTMLProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { buildStyles, cn, type ClassValue } from '@maurotaliente/react-styles';
import { Button, Icon } from '@maurotaliente/react-ui-base';
import {
  InputFrame,
  InputOptions,
  type InputOptionsDirection,
  moveActiveIndex,
  normalizeOptionText,
  normalizeActiveIndex,
  pickActiveOption,
  readOptionLabel,
  readOptionText,
  resolveOptionsDirection,
  toOptionArray,
  type FromInputCustomApi,
  type HtmlOmittedProps,
} from '@maurotaliente/react-form';

type HtmlInputProps = Omit<HTMLProps<HTMLInputElement>, HtmlOmittedProps>;
type SelectLike = Record<string, unknown> | string | number | null;

export interface InputSelectProps extends FromInputCustomApi, HtmlInputProps {
  placeholder?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  indicators?: 'off' | 'all';
  focusMode?: 'soft' | 'highLight';
  isClearable?: boolean;
  mode?: 'free' | 'strict';
  optionName: string;
  optionDisplayName?: string;
  optionBaseAddProps?: Record<string, unknown>;
  options?: SelectLike[];
  encode?: (value: unknown) => SelectLike;
  decode?: (value: SelectLike) => unknown;
  emptyOptionsLabel?: string;
}

const inputSelectStyleMap = {
  root: 'relative w-full',
  input: [
    'block w-full border-0 bg-bg-100 p-3 text-text-200',
    'appearance-none rounded-md focus:outline-none focus:shadow-none',
    'disabled:bg-disabled-bg disabled:text-disabled-text',
  ],
  caret: 'text-text-300',
  chevronButton: [
    'flex h-auto appearance-none focus:outline-none focus:shadow-none',
    'text-text-300 focus:text-text-100',
  ],
} as const;

export const inputSelectStyles = buildStyles(inputSelectStyleMap);

const encodeDefault = (value: unknown) => (value ?? null) as SelectLike;
const decodeDefault = (value: SelectLike) => value;

const readOptionValue = (candidate: SelectLike, key: string) => {
  return readOptionText(candidate, key);
};

export const InputSelect = ({
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
  mode = 'strict',
  optionName,
  optionDisplayName,
  optionBaseAddProps = {},
  options = [],
  encode = encodeDefault,
  decode = decodeDefault,
  emptyOptionsLabel = 'No options',
  onBlur = () => {},
  onFocus = () => {},
  onChange = () => {},
  onKeyDown = () => {},
  ...inputProps
}: InputSelectProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const enterHandledInKeyDownRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  const optionsDirectionRef = useRef<InputOptionsDirection>('down');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const allOptions = useMemo(() => toOptionArray<SelectLike>(options), [options]);
  const selected = encode(value ?? null);
  const selectedKey = normalizeOptionText(readOptionValue(selected, optionName));
  const selectedFromOptions = useMemo(() => {
    if (!selectedKey) return null;
    return allOptions.find((option) => normalizeOptionText(readOptionValue(option, optionName)) === selectedKey) ?? null;
  }, [allOptions, optionName, selectedKey]);
  const selectedOption = selectedFromOptions ?? selected;
  const selectedLabel = selectedOption ? readOptionLabel(selectedOption, optionName, optionDisplayName) : '';

  const query = isExpanded ? normalizeOptionText(searchValue) : '';
  const filteredOptions = useMemo(() => {
    return allOptions.filter((option) => {
      const key = normalizeOptionText(readOptionValue(option, optionName));
      if (!key) return false;
      if (!query) return true;
      const label = normalizeOptionText(readOptionLabel(option, optionName, optionDisplayName));
      return key.includes(query) || label.includes(query);
    });
  }, [allOptions, optionName, optionDisplayName, query]);

  const normalizedActiveIndex = normalizeActiveIndex(activeIndex, filteredOptions.length);
  const showFocus = focusMode === 'highLight' && !!focus;
  const showSuccess = indicators === 'all' && !error && !!touched;
  const showIndicators = indicators === 'all' && (showSuccess || !!showError);
  const showOptions = !!focus && isExpanded && !disabled && !loading && allOptions.length > 0;
  const showClear = isClearable && !disabled && !loading && !!selectedLabel;

  const resolvedStyles = buildStyles({
    root: [inputSelectStyleMap.root, className as ClassValue],
    input: inputSelectStyleMap.input,
    caret: inputSelectStyleMap.caret,
    chevronButton: inputSelectStyleMap.chevronButton,
  });

  const publishValue = (nextValue: SelectLike) => {
    onChange(decode(nextValue) as never);
  };

  const commitOption = (option: SelectLike) => {
    setSearchValue('');
    setIsExpanded(false);
    setActiveIndex(-1);
    publishValue(option);
  };

  const commitByInput = (sourceRaw?: string) => {
    const source = (sourceRaw ?? '').trim();
    if (!source) return false;

    const sourceNorm = normalizeOptionText(source);
    const strictCandidate =
      filteredOptions[normalizedActiveIndex] ??
      allOptions.find((option) => normalizeOptionText(readOptionValue(option, optionName)) === sourceNorm) ??
      allOptions.find((option) => normalizeOptionText(readOptionLabel(option, optionName, optionDisplayName)) === sourceNorm) ??
      allOptions.find((option) => {
        const key = normalizeOptionText(readOptionValue(option, optionName));
        const label = normalizeOptionText(readOptionLabel(option, optionName, optionDisplayName));
        return key.includes(sourceNorm) || label.includes(sourceNorm);
      });

    if (mode === 'strict') {
      if (!strictCandidate) return false;
      commitOption(strictCandidate);
      return true;
    }

    if (strictCandidate) {
      commitOption(strictCandidate);
      return true;
    }

    const nextFree: Record<string, unknown> = { [optionName]: source, ...optionBaseAddProps };
    if (optionDisplayName && !nextFree[optionDisplayName]) {
      nextFree[optionDisplayName] = source;
    }
    commitOption(nextFree);
    return true;
  };

  const commitActiveOption = () => {
    const candidate = pickActiveOption(filteredOptions, normalizedActiveIndex);
    if (!candidate) return false;
    commitOption(candidate);
    return true;
  };

  const handleClear = () => {
    setSearchValue('');
    setIsExpanded(false);
    setActiveIndex(-1);
    publishValue(null);
    queueMicrotask(() => inputRef.current?.focus());
  };

  const handleToggleExpand = () => {
    if (disabled || loading) return;
    setIsExpanded((prev) => !prev);
    queueMicrotask(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown(event);

    if (event.key === 'Enter') {
      // When options are closed and there is no pending query, behave like a regular input:
      // do not trap Enter and let the event propagate (e.g. form submit).
      if (!isExpanded && !searchValue.trim()) {
        enterHandledInKeyDownRef.current = false;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const source = searchValue;
      const didCommit = commitActiveOption();
      if (!didCommit) commitByInput(source);
      enterHandledInKeyDownRef.current = true;
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsExpanded(true);
      if (filteredOptions.length === 0) return;
      setActiveIndex((prev) => moveActiveIndex(prev, filteredOptions.length, 'next'));
      event.currentTarget.focus();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsExpanded(true);
      if (filteredOptions.length === 0) return;
      setActiveIndex((prev) => moveActiveIndex(prev, filteredOptions.length, 'prev'));
      event.currentTarget.focus();
      return;
    }

    if (event.key === 'Escape') {
      if (isExpanded) {
        event.preventDefault();
        event.stopPropagation();
      }
      setSearchValue('');
      setIsExpanded(false);
      setActiveIndex(-1);
      onBlur();
      return;
    }

    if (event.key === 'Tab') {
      // Let Tab move focus naturally without committing typed query.
      skipBlurCommitRef.current = true;
      setSearchValue('');
      setIsExpanded(false);
      setActiveIndex(-1);
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (!isExpanded && !searchValue.trim()) return;
    event.preventDefault();
    event.stopPropagation();
    if (enterHandledInKeyDownRef.current) {
      enterHandledInKeyDownRef.current = false;
      return;
    }
    const source = searchValue;
    const didCommit = commitActiveOption();
    if (!didCommit) commitByInput(source);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next && event.currentTarget.contains(next)) return;
    const source = searchValue;
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
    } else if (source.trim()) {
      commitByInput(source);
    }
    setSearchValue('');
    setIsExpanded(false);
    setActiveIndex(-1);
    onBlur();
  };

  useEffect(() => {
    if (focus) return;
    setIsExpanded(false);
    setSearchValue('');
    setActiveIndex(-1);
  }, [focus]);

  useEffect(() => {
    setActiveIndex((prev) => normalizeActiveIndex(prev, filteredOptions.length));
  }, [filteredOptions.length]);

  if (hidden) return null;

  const liveValue = isExpanded ? searchValue : selectedLabel;

  return (
    <div className={resolvedStyles.root} onBlur={handleBlur}>
      <InputFrame
        focus={!!focus}
        showFocus={showFocus}
        showError={!!showError}
        showSuccess={showSuccess}
        disabled={disabled || loading}
        overflowHidden
        hasIndicators={showIndicators}
        indicators={indicators}
        prefix={prefix}
        suffix={suffix}
        isClearable={showClear}
        onClear={handleClear}
        clearAriaLabel="Clear option"
        rightActionsClassName="gap-0.5"
        rightActions={
          <Button
            type="button"
            variant="text"
            size="icon-sm"
            className={resolvedStyles.chevronButton}
            tabIndex={-1}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={handleToggleExpand}
            aria-label={isExpanded ? 'Close options' : 'Open options'}
          >
            <span className={resolvedStyles.caret} aria-hidden>
              <Icon name="IconChevronDown" size={22} />
            </span>
          </Button>
        }
      >
        <input
          {...inputProps}
          ref={inputRef}
          value={liveValue}
          disabled={disabled || loading}
          placeholder={placeholder}
          className={cn(resolvedStyles.input)}
          autoComplete="off"
          onFocus={() => {
            setSearchValue('');
            setIsExpanded(true);
            setActiveIndex(-1);
            optionsDirectionRef.current = resolveOptionsDirection(inputRef.current);
            onFocus();
          }}
          onMouseDown={() => {
            if (!disabled && !loading) setIsExpanded(true);
          }}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setIsExpanded(true);
            setActiveIndex(-1);
            optionsDirectionRef.current = resolveOptionsDirection(inputRef.current);
            onFocus();
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          readOnly={!isExpanded}
        />
      </InputFrame>
      <InputOptions<SelectLike>
        isOpen={showOptions}
        direction={optionsDirectionRef.current}
        options={filteredOptions}
        activeIndex={normalizedActiveIndex}
        emptyLabel={emptyOptionsLabel}
        getOptionKey={(option, index) => `${readOptionValue(option, optionName)}-${index}`}
        getOptionLabel={(option) => readOptionLabel(option, optionName, optionDisplayName)}
        isOptionSelected={(option) => {
          const candidate = normalizeOptionText(readOptionValue(option, optionName));
          return !!candidate && candidate === selectedKey;
        }}
        onHoverIndexChange={(index) => {
          setActiveIndex(index);
        }}
        onSelect={(option) => {
          commitOption(option);
          queueMicrotask(() => inputRef.current?.focus());
        }}
        onOptionKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          event.preventDefault();
          event.stopPropagation();
          setSearchValue('');
          setIsExpanded(false);
          setActiveIndex(-1);
          skipBlurCommitRef.current = true;
          queueMicrotask(() => inputRef.current?.focus());
        }}
      />
    </div>
  );
};

InputSelect.displayName = 'InputSelect';
