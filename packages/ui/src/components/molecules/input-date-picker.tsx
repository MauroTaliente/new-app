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
import { buildStyles, type ClassValue } from '@react33/react-styles';
import {
  addMonthsSafe,
  buildCalendarMonth,
  clampDate,
  isAfterLocalDay,
  isArray,
  isSameLocalDay,
  normalizeDateRange,
  toDateSafe,
  toIsoDateTime,
  toLocalDateKey,
} from '@react33/react-helpers';
import { Button, Icon } from '@react33/react-ui-base';
import {
  InputFrame,
  type FromInputCustomApi,
  type HtmlOmittedProps,
} from '@react33/react-form';

type DateSingle = Date | null;
type DateRange = [DateSingle, DateSingle];
type IsoSingle = string | null;
type IsoRange = [IsoSingle, IsoSingle];
type DateLike = Date | string | number;
type RelativeDateLimit = {
  yearsFromToday?: number;
  monthsFromToday?: number;
  daysFromToday?: number;
};
type DateLimitInput = DateLike | RelativeDateLimit;
type SelectionMode = 'single' | 'range';
type ValueMode = 'date' | 'iso';
type DayMatcher = (day: Date) => boolean;
type DateRuleType = 'disabled' | 'regular';

export interface InputDatePickerRule {
  type: DateRuleType;
  name: string;
  matchers?: DayMatcher[];
  dates?: DateLike[];
  className?: string;
  render?: (props: InputDatePickerRuleRenderProps) => ReactNode;
}

export interface InputDatePickerRuleRenderProps {
  type: DateRuleType;
  name: string;
  matchers: DayMatcher[];
  dates: DateLike[];
  className?: string;
  render?: InputDatePickerRule['render'];
  day: Date;
  isoKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  currentDate: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isEdge: boolean;
  rangeLeft: boolean;
  rangeRight: boolean;
  rangeMiddle: boolean;
  content: ReactNode;
}

type HtmlInputDatePickerProps = Omit<HTMLProps<HTMLInputElement>, HtmlOmittedProps>;

export interface InputDatePickerProps extends FromInputCustomApi, HtmlInputDatePickerProps {
  selectionMode?: SelectionMode;
  valueMode?: ValueMode;
  locale?: string;
  placeholder?: string;
  isClearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
  indicators?: 'off' | 'all';
  focusMode?: 'soft' | 'highLight';
  minDate?: DateLimitInput;
  maxDate?: DateLimitInput;
  weekStartsOn?: 0 | 1;
  extraMonthRows?: number;
  rules?: InputDatePickerRule[];
  useDefaultDayStyles?: boolean;
  /** Maps the external `value` into the shape the picker parses (same contract as `InputSelect.encode`). */
  encode?: (value: unknown) => unknown;
  /** Maps the committed picker output before calling `onChange` (same contract as `InputSelect.decode`). */
  decode?: (value: unknown) => unknown;
}

type RuleBucket = {
  rule: InputDatePickerRule;
  dateKeys: Set<string>;
  matchers: DayMatcher[];
};

const inputDatePickerStyleMap = {
  root: 'relative w-full',
  trigger: [
    'w-full rounded-md bg-bg-100 px-3 py-3 text-left text-text-200',
    'appearance-none focus:outline-none focus:shadow-none',
    'disabled:bg-disabled-bg disabled:text-disabled-text',
  ],
  triggerPlaceholder: 'text-text-300',
  iconButton: 'text-text-300',
  popover: [
    'absolute left-0 top-[calc(100%+0.5rem)] z-[1400] w-[19rem] rounded-md border border-border-200 bg-bg-100 p-3 shadow-lg',
  ],
  monthHeader: 'mb-3 flex items-center justify-between',
  monthTitle: 'text-sm font-medium text-text-100',
  monthActions: 'flex items-center gap-1',
  weekHeader: 'mb-1 grid grid-cols-7 gap-1',
  weekHeaderCell: 'h-8 text-center text-xs font-medium text-text-300',
  monthGrid: 'grid grid-cols-7 gap-1',
  dayButton: [
    'cursor-pointer h-9 rounded-md border border-transparent text-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200',
    'enabled:hover:bg-accent-200 enabled:hover:text-accent-alt-100 enabled:hover:font-medium',
  ],
  dayOut: 'text-text-300',
  dayActive: 'ring-2 ring-accent-200/60 ring-offset-1 ring-offset-bg-100',
  dayToday: 'text-accent-100 bg-accent-300/50',
  dayDisabled: 'cursor-not-allowed text-disabled-text opacity-60',
  dayInRange: 'bg-bg-300 text-text-100',
  dayEdge: 'bg-accent-200 text-accent-alt-100 font-medium',
} as const;

export const inputDatePickerStyles = buildStyles(inputDatePickerStyleMap);

const normalizeRuleBucket = (rule: InputDatePickerRule): RuleBucket => {
  const output: RuleBucket = {
    rule,
    dateKeys: new Set<string>(),
    matchers: isArray(rule.matchers) ? rule.matchers.filter((matcher) => typeof matcher === 'function') : [],
  };
  const rawDates = isArray(rule.dates) ? rule.dates : [];
  rawDates.forEach((value) => {
    const date = toDateSafe(value);
    if (date) output.dateKeys.add(toLocalDateKey(date));
  });
  return output;
};

const hasRuleMatch = (bucket: RuleBucket, day: Date): boolean => {
  const key = toLocalDateKey(day);
  if (bucket.dateKeys.has(key)) return true;
  return bucket.matchers.some((matcher) => matcher(day));
};

const isRuleUnrestricted = (bucket: RuleBucket) => {
  return bucket.dateKeys.size === 0 && bucket.matchers.length === 0;
};

const isRegularRuleActive = (bucket: RuleBucket, day: Date) => {
  if (bucket.rule.type !== 'regular') return false;
  if (isRuleUnrestricted(bucket)) return true;
  return hasRuleMatch(bucket, day);
};

const toDisplayDate = (value: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
};

const isDayFirstLocale = (locale: string) => {
  const parts = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(2026, 10, 9));
  const dayIndex = parts.findIndex((part) => part.type === 'day');
  const monthIndex = parts.findIndex((part) => part.type === 'month');
  if (dayIndex === -1 || monthIndex === -1) return true;
  return dayIndex < monthIndex;
};

const parseDateInput = (raw: string, locale: string): DateSingle => {
  const input = raw.trim();
  if (!input) return null;

  const match = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (match) {
    const [, firstPart, secondPart, yearPart] = match;
    if (!firstPart || !secondPart || !yearPart) return null;
    const dayFirst = isDayFirstLocale(locale);
    const parsedYear = Number(yearPart);
    const year = yearPart.length === 2 ? 2000 + parsedYear : parsedYear;
    const day = dayFirst ? Number(firstPart) : Number(secondPart);
    const month = dayFirst ? Number(secondPart) : Number(firstPart);
    const candidate = new Date(year, month - 1, day);
    const validCandidate =
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day;
    if (!validCandidate) return null;
    return candidate;
  }

  const direct = toDateSafe(input);
  if (direct) return new Date(direct.getFullYear(), direct.getMonth(), direct.getDate());
  return null;
};

const parseRangeInput = (raw: string, locale: string): DateRange | null => {
  const input = raw.trim();
  if (!input) return [null, null];
  const parts = input.split(/\s+-\s+/);
  if (parts.length > 2) return null;

  const first = parseDateInput(parts[0] ?? '', locale);
  const second = parseDateInput(parts[1] ?? '', locale);
  if (!parts[0]?.trim()) return null;
  if (!first) return null;
  if (parts.length === 1) return [first, null];
  if (!parts[1]?.trim()) return [first, null];
  if (!second) return null;
  return [first, second];
};

/** Typed segment with separators but not a full DD/MM/YYYY (locale segments) — treat as incomplete on blur. */
const isPartialStructuredSingleDate = (raw: string) => {
  const input = raw.trim();
  if (!input) return false;
  if (!/[./-]/.test(input)) return false;
  return !/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/.test(input);
};

const pickerEncodeDefault = (value: unknown) => value;
const pickerDecodeDefault = (value: unknown) => value;

const parseDateLikeToLocalDay = (value: unknown): DateSingle => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const candidate = new Date(year, month - 1, day);
      const isValid =
        candidate.getFullYear() === year &&
        candidate.getMonth() === month - 1 &&
        candidate.getDate() === day;
      if (isValid) return candidate;
    }
  }

  const parsed = toDateSafe(value);
  if (!parsed) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const isRelativeDateLimit = (value: unknown): value is RelativeDateLimit => {
  if (!value || typeof value !== 'object') return false;
  if (value instanceof Date || isArray(value)) return false;
  return (
    'yearsFromToday' in value ||
    'monthsFromToday' in value ||
    'daysFromToday' in value
  );
};

const resolveDateLimitInput = (value: DateLimitInput | undefined, todayLocal: Date): DateSingle => {
  if (value === undefined) return null;
  if (isRelativeDateLimit(value)) {
    const years = value.yearsFromToday ?? 0;
    const months = value.monthsFromToday ?? 0;
    const days = value.daysFromToday ?? 0;
    const hasRelativeData = value.yearsFromToday !== undefined || value.monthsFromToday !== undefined || value.daysFromToday !== undefined;
    if (!hasRelativeData) return null;
    const candidate = new Date(
      todayLocal.getFullYear() + years,
      todayLocal.getMonth() + months,
      todayLocal.getDate() + days,
    );
    return new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate());
  }
  return parseDateLikeToLocalDay(value);
};

const parseLocalDateKey = (key: string): DateSingle => {
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(year, month - 1, day);
  const isValid =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;
  return isValid ? candidate : null;
};

const getWeekdayLabels = (locale: string, weekStartsOn: 0 | 1) => {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const baseline = new Date(2026, 0, 4); // Sunday
  return Array.from({ length: 7 }, (_, index) => {
    const offset = (weekStartsOn + index) % 7;
    const day = new Date(baseline.getFullYear(), baseline.getMonth(), baseline.getDate() + offset);
    return formatter.format(day).slice(0, 2).toUpperCase();
  });
};

const parseSelection = (value: unknown, selectionMode: SelectionMode, valueMode: ValueMode): DateRange => {
  if (selectionMode === 'range') {
    if (!isArray(value)) return [null, null];
    const [rawStart, rawEnd] = value;
    return [parseDateLikeToLocalDay(rawStart), parseDateLikeToLocalDay(rawEnd)];
  }
  return [parseDateLikeToLocalDay(value), null];
};

const formatOutput = (
  start: DateSingle,
  end: DateSingle,
  selectionMode: SelectionMode,
  valueMode: ValueMode,
): DateSingle | DateRange | IsoSingle | IsoRange => {
  if (selectionMode === 'single') {
    if (valueMode === 'date') return start;
    return start ? toLocalDateKey(start) : null;
  }
  if (valueMode === 'date') return [start, end];
  return [start ? toLocalDateKey(start) : null, end ? toLocalDateKey(end) : null];
};

export const InputDatePicker = ({
  value,
  onChange = () => { },
  onFocus = () => { },
  onBlur = () => { },
  focus = false,
  error,
  showError = false,
  touched = false,
  disabled = false,
  loading = false,
  hidden = false,
  indicators = 'off',
  focusMode = 'soft',
  className,
  selectionMode = 'single',
  valueMode = 'date',
  locale = 'es-AR',
  placeholder = 'Selecciona una fecha',
  isClearable = false,
  minDate,
  maxDate,
  weekStartsOn = 1,
  extraMonthRows,
  rules,
  useDefaultDayStyles = true,
  encode = pickerEncodeDefault,
  decode = pickerDecodeDefault,
  name,
  id,
}: InputDatePickerProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const commitDraftValueRef = useRef<() => void>(() => {});
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [syncDayFocus, setSyncDayFocus] = useState(false);

  const innerValue = useMemo(() => {
    try {
      return encode(value ?? null);
    } catch {
      return value;
    }
  }, [value, encode]);

  const [startDate, endDate] = useMemo(
    () => parseSelection(innerValue, selectionMode, valueMode),
    [innerValue, selectionMode, valueMode],
  );

  const hasValue = selectionMode === 'single' ? !!startDate : !!startDate || !!endDate;
  const locked = disabled || loading;
  const showClean = isClearable && hasValue && !locked;
  const showFocus = focusMode === 'highLight' && focus;
  const showSuccess = indicators === 'all' && !error && touched;
  const showIndicators = indicators === 'all' && (showSuccess || showError);

  const todayLocal = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const minBound = useMemo(() => resolveDateLimitInput(minDate, todayLocal), [minDate, todayLocal]);
  const maxBound = useMemo(() => resolveDateLimitInput(maxDate, todayLocal), [maxDate, todayLocal]);

  const normalizedRules = useMemo(() => {
    if (!isArray(rules)) return [];
    return rules.map(normalizeRuleBucket);
  }, [rules]);

  const isDayOutOfBounds = (day: Date) => {
    if (minBound && isAfterLocalDay(minBound, day)) return true;
    if (maxBound && isAfterLocalDay(day, maxBound)) return true;
    return false;
  };

  const isDayDisabled = (day: Date) => {
    if (isDayOutOfBounds(day)) return true;
    return normalizedRules.some((bucket) => bucket.rule.type === 'disabled' && hasRuleMatch(bucket, day));
  };

  const monthGrid = useMemo(() => {
    const fullMonthGrid = buildCalendarMonth(viewMonth, weekStartsOn);
    if (extraMonthRows === undefined) return fullMonthGrid;

    const daysInCurrentMonth = fullMonthGrid.weeks.reduce((acc, week) => {
      return acc + week.filter((cell) => cell.isCurrentMonth).length;
    }, 0);
    const leadingDays = fullMonthGrid.weeks[0]?.filter((cell) => !cell.isCurrentMonth).length ?? 0;
    const minRows = Math.ceil((leadingDays + daysInCurrentMonth) / 7);
    const normalizedExtraRows = Math.max(0, Math.floor(extraMonthRows));
    const targetRows = Math.min(Math.max(minRows + normalizedExtraRows, minRows), fullMonthGrid.weeks.length);
    return {
      ...fullMonthGrid,
      weeks: fullMonthGrid.weeks.slice(0, targetRows),
    };
  }, [viewMonth, weekStartsOn, extraMonthRows]);
  const weekdays = useMemo(() => getWeekdayLabels(locale, weekStartsOn), [locale, weekStartsOn]);

  const monthLabel = useMemo(
    () => {
      const formatted = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(monthGrid.month);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },
    [locale, monthGrid.month],
  );

  const displayValue = useMemo(() => {
    if (selectionMode === 'single') {
      return startDate ? toDisplayDate(startDate, locale) : '';
    }
    if (!startDate && !endDate) return '';
    if (startDate && !endDate) return `${toDisplayDate(startDate, locale)} -`;
    if (!startDate && endDate) return `- ${toDisplayDate(endDate, locale)}`;
    return `${toDisplayDate(startDate as Date, locale)} - ${toDisplayDate(endDate as Date, locale)}`;
  }, [selectionMode, startDate, endDate, locale]);
  const [draftValue, setDraftValue] = useState(displayValue);

  useEffect(() => {
    setDraftValue(displayValue);
  }, [displayValue]);

  const parsedDraftSingle = useMemo(() => {
    if (selectionMode !== 'single') return null;
    if (!draftValue.trim()) return null;
    return parseDateInput(draftValue, locale);
  }, [selectionMode, draftValue, locale]);

  const parsedDraftRange = useMemo(() => {
    if (selectionMode !== 'range') return null;
    return parseRangeInput(draftValue, locale);
  }, [selectionMode, draftValue, locale]);

  const [visualStartDate, visualEndDate] = useMemo<DateRange>(() => {
    if (!open) return [startDate, endDate];

    if (selectionMode === 'single') {
      if (!draftValue.trim()) return [null, null];
      if (parsedDraftSingle) return [parsedDraftSingle, null];
      return [startDate, endDate];
    }

    if (parsedDraftRange) return parsedDraftRange;
    return [startDate, endDate];
  }, [open, selectionMode, draftValue, parsedDraftSingle, parsedDraftRange, startDate, endDate]);

  useEffect(() => {
    if (!open) return () => { };
    const draftAnchor =
      selectionMode === 'single'
        ? parsedDraftSingle
        : (parsedDraftRange?.[0] ?? null);
    const candidate = clampDate(draftAnchor ?? startDate ?? new Date(), minBound, maxBound);
    setViewMonth(new Date(candidate.getFullYear(), candidate.getMonth(), 1));
    return () => { };
  }, [open, selectionMode, parsedDraftSingle, parsedDraftRange, startDate, minBound, maxBound]);

  useEffect(() => {
    if (!open) return () => { };
    const candidate = clampDate(visualStartDate ?? visualEndDate ?? new Date(), minBound, maxBound);
    setActiveDayKey(toLocalDateKey(candidate));
    return () => { };
  }, [open, visualStartDate, visualEndDate, minBound, maxBound]);

  useEffect(() => {
    if (!open) return () => { };
    const closeIfOutside = (target: EventTarget | null) => {
      const node = target as Node | null;
      if (!node) return;
      if (rootRef.current?.contains(node)) return;
      commitDraftValueRef.current();
      setOpen(false);
      onBlur();
    };

    const handleClickOutside = (event: MouseEvent) => {
      closeIfOutside(event.target);
    };

    const handleFocusInOutside = (event: globalThis.FocusEvent) => {
      closeIfOutside(event.target);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('focusin', handleFocusInOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleFocusInOutside);
    };
  }, [open, onBlur]);

  useEffect(() => {
    if (!open || !activeDayKey || !syncDayFocus) return () => { };

    const orderedCells = monthGrid.weeks.flat();
    const activeTarget = dayRefs.current[activeDayKey];
    if (activeTarget && !activeTarget.disabled) {
      activeTarget.focus();
      setSyncDayFocus(false);
      return () => { };
    }

    const activeIndex = orderedCells.findIndex((cell) => cell.isoKey === activeDayKey);
    const cellsByPriority =
      activeIndex >= 0
        ? [...orderedCells.slice(activeIndex), ...orderedCells.slice(0, activeIndex)]
        : orderedCells;
    const fallbackCell = cellsByPriority.find((cell) => !isDayDisabled(cell.date));
    if (fallbackCell) {
      setActiveDayKey(fallbackCell.isoKey);
      const fallbackTarget = dayRefs.current[fallbackCell.isoKey];
      if (fallbackTarget && !fallbackTarget.disabled) fallbackTarget.focus();
    }
    setSyncDayFocus(false);
    return () => { };
  }, [open, activeDayKey, syncDayFocus, monthGrid]);

  const emit = (nextStart: DateSingle, nextEnd: DateSingle) => {
    const output = formatOutput(nextStart, nextEnd, selectionMode, valueMode);
    try {
      onChange(decode(output) as never);
    } catch {
      onChange(output as never);
    }
  };

  const focusInput = () => inputRef.current?.focus();

  const moveActiveDay = (amount: number) => {
    const currentFromKey = activeDayKey ? parseLocalDateKey(activeDayKey) : null;
    const current = currentFromKey ?? startDate ?? endDate ?? new Date();
    const moved = clampDate(
      new Date(current.getFullYear(), current.getMonth(), current.getDate() + amount),
      minBound,
      maxBound,
    );
    setViewMonth(new Date(moved.getFullYear(), moved.getMonth(), 1));
    setActiveDayKey(toLocalDateKey(moved));
    setSyncDayFocus(true);
  };

  const commitDraftValue = () => {
    if (selectionMode === 'single') {
      if (!draftValue.trim()) {
        emit(null, null);
        return;
      }
      if (isPartialStructuredSingleDate(draftValue)) {
        setDraftValue(displayValue);
        return;
      }
      const parsed = parseDateInput(draftValue, locale);
      if (!parsed) {
        setDraftValue(displayValue);
        return;
      }
      if (isDayDisabled(parsed)) {
        setDraftValue(displayValue);
        return;
      }
      emit(parsed, null);
      setActiveDayKey(toLocalDateKey(parsed));
      return;
    }

    const trimmedRange = draftValue.trim();
    if (trimmedRange.includes(' - ')) {
      const segments = trimmedRange.split(/\s+-\s+/);
      if (segments.some((segment) => segment.trim() && isPartialStructuredSingleDate(segment))) {
        setDraftValue(displayValue);
        return;
      }
    }

    const parsedRange = parseRangeInput(draftValue, locale);
    if (!parsedRange) {
      setDraftValue(displayValue);
      return;
    }

    const [rawStart, rawEnd] = parsedRange;
    if (!rawStart && !rawEnd) {
      emit(null, null);
      return;
    }

    const [nextStart, nextEnd] = normalizeDateRange(rawStart, rawEnd);
    if (nextStart && isDayDisabled(nextStart)) {
      setDraftValue(displayValue);
      return;
    }
    if (nextEnd && isDayDisabled(nextEnd)) {
      setDraftValue(displayValue);
      return;
    }
    emit(nextStart, nextEnd);
    if (nextEnd) setActiveDayKey(toLocalDateKey(nextEnd));
    else if (nextStart) setActiveDayKey(toLocalDateKey(nextStart));
  };

  commitDraftValueRef.current = commitDraftValue;

  const handleInputFocus = () => {
    onFocus();
  };

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    // Con el popover abierto, el foco puede pasar al calendario dentro del root sin cerrar aún.
    // Con el popover cerrado, prefix (calendario), clear, etc. siguen dentro del root: ahí sí hay que confirmar el draft al salir del input.
    if (open && nextTarget && rootRef.current?.contains(nextTarget)) return;
    commitDraftValue();
    setOpen(false);
    onBlur();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      setDraftValue(displayValue);
      setOpen(false);
      onBlur();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (locked) return;
      event.preventDefault();
      setSyncDayFocus(true);
      setOpen(true);
      return;
    }
    if (event.key === 'Enter') {
      if (!open) return;
      event.preventDefault();
      commitDraftValue();
      setOpen(false);
      queueMicrotask(() => focusInput());
    }
  };

  const handleInputClick = () => {
    if (locked) return;
    setOpen(true);
  };

  const isDayInRange = (day: Date) => {
    if (!visualStartDate || !visualEndDate) return false;
    const [normalizedStart, normalizedEnd] = normalizeDateRange(visualStartDate, visualEndDate);
    const afterStart = isAfterLocalDay(day, normalizedStart) || isSameLocalDay(day, normalizedStart);
    const beforeEnd = isAfterLocalDay(normalizedEnd, day) || isSameLocalDay(day, normalizedEnd);
    return afterStart && beforeEnd;
  };

  const selectDay = (day: Date) => {
    if (locked) return;
    if (isDayDisabled(day)) return;
    if (selectionMode === 'single') {
      emit(day, null);
      setOpen(false);
      queueMicrotask(() => focusInput());
      return;
    }
    if (!startDate || (startDate && endDate)) {
      emit(day, null);
      return;
    }
    const [normalizedStart, normalizedEnd] = normalizeDateRange(startDate, day);
    emit(normalizedStart, normalizedEnd);
    setOpen(false);
    queueMicrotask(() => focusInput());
  };

  const handleClear = () => {
    setDraftValue('');
    if (selectionMode === 'single') emit(null, null);
    else emit(null, null);
  };

  const resolvedStyles = buildStyles({
    root: [inputDatePickerStyles.root, hidden && 'hidden'],
    content: [
      locked && 'bg-disabled-bg',
      className,
    ],
    trigger: [
      inputDatePickerStyles.trigger,
      !draftValue && inputDatePickerStyles.triggerPlaceholder,
      (showClean || showIndicators) && 'pr-10',
      showClean && showIndicators && 'pr-18',
    ],
    popover: [inputDatePickerStyles.popover, hidden && 'hidden'],
    iconButton: [
      inputDatePickerStyles.iconButton,
      locked && 'text-disabled-text',
    ],
  });

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: Date) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveActiveDay(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveActiveDay(-1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActiveDay(7);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActiveDay(-7);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      moveActiveDay(-(day.getDay() - weekStartsOn + 7) % 7);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      moveActiveDay(6 - ((day.getDay() - weekStartsOn + 7) % 7));
      return;
    }
    if (event.key === 'PageUp') {
      event.preventDefault();
      moveActiveDay(event.shiftKey ? -365 : -31);
      return;
    }
    if (event.key === 'PageDown') {
      event.preventDefault();
      moveActiveDay(event.shiftKey ? 365 : 31);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectDay(day);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraftValue(displayValue);
      setOpen(false);
      onBlur();
      focusInput();
    }
  };

  return (
    <div ref={rootRef} className={resolvedStyles.root}>
      <InputFrame
        className={resolvedStyles.content}
        focus={!!focus}
        showFocus={showFocus}
        showError={!!showError}
        showSuccess={showSuccess}
        disabled={locked}
        overflowHidden={showClean}
        hasIndicators={showIndicators}
        isClearable={showClean}
        onClear={handleClear}
        clearAriaLabel="Clear date"
        indicators={indicators}
        prefix={
          <Button
            type="button"
            variant="text"
            size="icon-sm"
            tabIndex={-1}
            className={resolvedStyles.iconButton}
            disabled={locked}
            onClick={handleInputClick}
            aria-label="Open date picker"
          >
            <Icon name="IconCalendarMonth" size={18} />
          </Button>
        }
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          disabled={locked}
          className={resolvedStyles.trigger}
          value={draftValue}
          placeholder={placeholder}
          onChange={(event) => setDraftValue(event.currentTarget.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={handleInputClick}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          autoComplete="off"
        />
      </InputFrame>

      {open ? (
        <div className={resolvedStyles.popover} role="dialog" aria-label="Date picker calendar">
          <div className={inputDatePickerStyles.monthHeader}>
            <p className={inputDatePickerStyles.monthTitle}>{monthLabel}</p>
            <div className={inputDatePickerStyles.monthActions}>
              <Button
                type="button"
                variant="text"
                size="icon-xs"
                aria-label="Previous month"
                disabled={locked}
                onClick={() => setViewMonth((prev) => addMonthsSafe(prev, -1))}
              >
                <Icon name="IconChevronLeft" size={16} />
              </Button>
              <Button
                type="button"
                variant="text"
                size="icon-xs"
                aria-label="Next month"
                disabled={locked}
                onClick={() => setViewMonth((prev) => addMonthsSafe(prev, 1))}
              >
                <Icon name="IconChevronRight" size={16} />
              </Button>
            </div>
          </div>

          <div className={inputDatePickerStyles.weekHeader}>
            {weekdays.map((weekday) => (
              <span key={weekday} className={inputDatePickerStyles.weekHeaderCell}>
                {weekday}
              </span>
            ))}
          </div>

          <div className={inputDatePickerStyles.monthGrid}>
            {monthGrid.weeks.flat().map((cell) => {
              const isDisabled = isDayDisabled(cell.date);
              const isInRange = isDayInRange(cell.date);
              const isToday = isSameLocalDay(cell.date, new Date());
              const isActive = activeDayKey === cell.isoKey;
              const isStart = isSameLocalDay(cell.date, visualStartDate);
              const isEnd = isSameLocalDay(cell.date, visualEndDate);
              const isEdge = isStart || isEnd;
              const rangeLeft = isStart;
              const rangeRight = isEnd;
              const rangeMiddle = isInRange && !isEdge;
              const matchingRegularRules = normalizedRules.filter((bucket) => {
                return isRegularRuleActive(bucket, cell.date);
              });
              const mergedRuleClassName = matchingRegularRules
                .map((bucket) => bucket.rule.className?.trim())
                .filter(Boolean);
              const dayClass = buildStyles({
                cell: [
                  inputDatePickerStyles.dayButton,
                  !cell.isCurrentMonth && inputDatePickerStyles.dayOut,
                  isActive && !isEdge && inputDatePickerStyles.dayActive,
                  useDefaultDayStyles && isToday && inputDatePickerStyles.dayToday,
                  useDefaultDayStyles && isInRange && inputDatePickerStyles.dayInRange,
                  useDefaultDayStyles && isEdge && inputDatePickerStyles.dayEdge,
                  isDisabled && inputDatePickerStyles.dayDisabled,
                  ...mergedRuleClassName,
                ],
              });
              const dayContent = matchingRegularRules.reduce<ReactNode>((content, bucket) => {
                if (!bucket.rule.render) return content;
                return bucket.rule.render({
                  type: bucket.rule.type,
                  name: bucket.rule.name,
                  matchers: bucket.matchers,
                  dates: bucket.rule.dates ?? [],
                  className: bucket.rule.className,
                  render: bucket.rule.render,
                  day: cell.date,
                  isoKey: cell.isoKey,
                  isCurrentMonth: cell.isCurrentMonth,
                  isToday,
                  currentDate: isToday,
                  isDisabled,
                  isSelected: isEdge,
                  isInRange,
                  isEdge,
                  rangeLeft,
                  rangeRight,
                  rangeMiddle,
                  content,
                });
              }, cell.day);
              return (
                <button
                  key={cell.isoKey}
                  type="button"
                  ref={(node) => {
                    dayRefs.current[cell.isoKey] = node;
                  }}
                  disabled={isDisabled}
                  className={dayClass.cell}
                  onClick={() => selectDay(cell.date)}
                  onFocus={() => setActiveDayKey(cell.isoKey)}
                  onKeyDown={(event) => handleDayKeyDown(event, cell.date)}
                  tabIndex={activeDayKey === cell.isoKey ? 0 : -1}
                  aria-pressed={isEdge || isInRange}
                >
                  {dayContent}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

InputDatePicker.displayName = 'InputDatePicker';
