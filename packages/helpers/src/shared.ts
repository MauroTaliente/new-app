// CONSTS
export const IS_BROWSER = typeof document !== 'undefined';

// BASICS
export function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    !(value instanceof Map) &&
    !(value instanceof Set)
  );
}

/**
 * Deep-merge `right` onto `left` (right wins on conflicts). Plain values replace.
 * Arrays merge index-by-index (same idea as Ramda `mergeDeepRight`), so nested error
 * shapes and similar structures compose like the legacy form stack.
 */
export function mergeDeepRight<L, R>(left: L, right: R): L & R {
  if (right === null || right === undefined) return left as L & R;
  if (left === null || left === undefined) return right as L & R;

  if (isArray(left) && isArray(right)) {
    const len = Math.max(left.length, right.length);
    const out: unknown[] = [];
    for (let i = 0; i < len; i++) {
      out[i] = mergeDeepRight(left[i], right[i]);
    }
    return out as L & R;
  }

  if (!isObject(left) || !isObject(right)) return right as L & R;

  const out = { ...left } as Record<string, unknown>;
  for (const key of Object.keys(right)) {
    const rv = (right as Record<string, unknown>)[key];
    const lv = out[key];
    if (isObject(lv) && isObject(rv)) {
      out[key] = mergeDeepRight(lv, rv);
    } else if (isArray(lv) && isArray(rv)) {
      out[key] = mergeDeepRight(lv, rv);
    } else {
      out[key] = rv;
    }
  }
  return out as L & R;
}

export function isEmptyObject(value: any): value is Record<string, never> {
  return isObject(value) && Object.keys(value).length === 0;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isEmptyArray(value: any): value is any[] {
  return isArray(value) && value.length === 0;
}

export function isNullOrEmpty(value: any): value is null | '' | undefined | [] | {} {
  return (
    value === null ||
    value === undefined ||
    value.length === 0 ||
    isEmptyObject(value) ||
    isEmptyArray(value)
  );
}

/**
 * Return a copy of `value` with entries removed where the entry value satisfies
 * `isNullOrEmpty` (i.e. `null | undefined | '' | [] | {}`).
 *
 * - Array → `filter` out empty entries (indexes collapse).
 * - Plain object → drop keys whose value is empty.
 * - Anything else → returned unchanged.
 *
 * Shallow: nested objects/arrays are kept as-is even if they only contain empty
 * values. Use `omitNullOrEmptyDeep` to prune recursively.
 */
export function omitNullOrEmpty<T>(value: readonly T[]): T[];
export function omitNullOrEmpty<T extends Record<string, unknown>>(value: T): Partial<T>;
export function omitNullOrEmpty<T>(value: T): T;
export function omitNullOrEmpty(value: any): any {
  if (isArray(value)) return value.filter((v) => !isNullOrEmpty(v));
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const v = (value as Record<string, unknown>)[key];
      if (!isNullOrEmpty(v)) out[key] = v;
    }
    return out;
  }
  return value;
}

/**
 * Recursive variant of `omitNullOrEmpty`: walks into nested objects and arrays
 * first, then prunes any branch that collapses to empty after pruning. Useful
 * for sanitising API payloads where `{ filters: { name: '', tags: [] } }`
 * should disappear from its parent.
 */
export function omitNullOrEmptyDeep<T>(value: readonly T[]): T[];
export function omitNullOrEmptyDeep<T extends Record<string, unknown>>(value: T): Partial<T>;
export function omitNullOrEmptyDeep<T>(value: T): T;
export function omitNullOrEmptyDeep(value: any): any {
  if (isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      const cleaned = omitNullOrEmptyDeep(item);
      if (!isNullOrEmpty(cleaned)) out.push(cleaned);
    }
    return out;
  }
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const cleaned = omitNullOrEmptyDeep((value as Record<string, unknown>)[key]);
      if (!isNullOrEmpty(cleaned)) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

export function isNullOrUndefined(value: any): value is null | '' | undefined | [] | {} {
  return value === undefined || value === null;
}

export function isEmpty(value: any): value is null | '' | undefined | [] | {} {
  return value === undefined || value.length === 0 || isEmptyObject(value) || isEmptyArray(value);
}

export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function isAsyncFunction(value: any): value is Function {
  return typeof value === 'function' && value.constructor.name === 'AsyncFunction';
}

export function isNestedEmptyObject(value: any): value is Record<string, never> {
  if (value === null || value === undefined || value === '') return true;

  if (isArray(value)) {
    return value.every(isNestedEmptyObject);
  }

  if (isObject(value)) {
    const values = Object.values(value);
    return values.length === 0 || values.every(isNestedEmptyObject);
  }

  return false;
}

export function safeParse<T>(value: unknown, fallback: any = null) {
  if (!isString(value)) return fallback;
  const t = value.trim();
  if (isNullOrUndefined(t)) return fallback;
  try {
    return JSON.parse(t) as T;
  } catch {
    return fallback as T;
  }
}

export const safeStringify = (value: any, space = 2, fallback = '') => {
  if (isString(value)) return value;
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return fallback;
  }
};

export const safeNumber = (value: unknown, fallback: number | null = null) => {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const trimmed = value.trim();
    if (!trimmed.length) return fallback;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

/**
 * Floor `value` and clamp it into `[min, max]` (max optional). Default `min = 1`
 * mirrors `safeInt` — built for pagination indexes where you arrived at a number
 * via arithmetic (e.g. `page + delta`) and need to guarantee a positive integer
 * before handing it to a setter or URL.
 *
 * NaN input passes through (same as the bare `Math.max(1, Math.floor(next))`
 * idiom). If you need NaN safety, validate before calling.
 */
export function clampInt(value: number, min = 1, max?: number): number {
  const n = Math.max(min, Math.floor(value));
  return max !== undefined ? Math.min(max, n) : n;
}

type NonU<T> = T extends undefined ? never : T;
export function getFallback<T>(...values: readonly T[]): NonU<T> | undefined {
  for (const v of values) if (v !== undefined) return v as NonU<T>;
  return undefined;
}

export function normalizeString(v: unknown) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export const capitalized = (s: string) => (s ? s[0]?.toUpperCase() + s.slice(1) : s);

// DATES
type DateFormat =
  | 'date'
  | 'date-time'
  | 'date-seconds'
  | 'time'
  | 'time-seconds'
  | 'full';

export function formatTimestamp(
  timestamp: string,
  format: DateFormat = 'date-time',
  locale: string = 'es-AR',
): string {
  const date = new Date(timestamp);

  const opts: Intl.DateTimeFormatOptions = (() => {
    switch (format) {
      case 'date':
        return { year: 'numeric', month: '2-digit', day: '2-digit' };
      case 'date-time':
        return {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        };
      case 'date-seconds':
        return {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        };
      case 'time':
        return { hour: '2-digit', minute: '2-digit' };
      case 'time-seconds':
        return { hour: '2-digit', minute: '2-digit', second: '2-digit' };
      case 'full':
        return {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        };
      default:
        return { year: 'numeric', month: '2-digit', day: '2-digit' };
    }
  })();

  return new Intl.DateTimeFormat(locale, opts).format(date);
}

export type DateLike = Date | string | number;
export type DatePair<T = Date | null> = [T, T];
export type CalendarMonthCell = {
  date: Date;
  day: number;
  isoKey: string;
  monthOffset: -1 | 0 | 1;
  isCurrentMonth: boolean;
};

export type CalendarMonthGrid = {
  month: Date;
  weeks: CalendarMonthCell[][];
};

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function toDateSafe(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (isValidDate(value)) return new Date(value.getTime());
  if (isString(value) || isNumber(value)) {
    const date = new Date(value);
    return isValidDate(date) ? date : null;
  }
  return null;
}

export function toStartOfDay(value: DateLike): Date {
  const date = toDateSafe(value) ?? new Date(0);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function toIsoDateTime(value: DateLike): string {
  const date = toDateSafe(value);
  if (!date) return '';
  return date.toISOString();
}

export function toLocalDateKey(value: DateLike): string {
  const date = toStartOfDay(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(a?: DateLike | null, b?: DateLike | null): boolean {
  if (!a || !b) return false;
  return toLocalDateKey(a) === toLocalDateKey(b);
}

export function isBeforeLocalDay(a?: DateLike | null, b?: DateLike | null): boolean {
  if (!a || !b) return false;
  return toStartOfDay(a).getTime() < toStartOfDay(b).getTime();
}

export function isAfterLocalDay(a?: DateLike | null, b?: DateLike | null): boolean {
  if (!a || !b) return false;
  return toStartOfDay(a).getTime() > toStartOfDay(b).getTime();
}

export function normalizeDateRange<T extends DateLike | null>(start: T, end: T): DatePair<T> {
  if (!start || !end) return [start, end];
  return isAfterLocalDay(start, end) ? [end, start] : [start, end];
}

export function addMonthsSafe(value: DateLike, amount: number): Date {
  const base = toDateSafe(value) ?? new Date();
  return new Date(base.getFullYear(), base.getMonth() + amount, 1);
}

export function getMonthStart(value: DateLike): Date {
  const date = toDateSafe(value) ?? new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(value: DateLike): Date {
  const date = toDateSafe(value) ?? new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getMonthDays(value: DateLike): number {
  return getMonthEnd(value).getDate();
}

export function clampDate(value: DateLike, min?: DateLike | null, max?: DateLike | null): Date {
  const date = toStartOfDay(value);
  const minDate = min ? toStartOfDay(min) : null;
  const maxDate = max ? toStartOfDay(max) : null;
  if (minDate && date.getTime() < minDate.getTime()) return minDate;
  if (maxDate && date.getTime() > maxDate.getTime()) return maxDate;
  return date;
}

export function buildCalendarMonth(
  month: DateLike,
  weekStartsOn: 0 | 1 = 1,
): CalendarMonthGrid {
  const target = getMonthStart(month);
  const year = target.getFullYear();
  const monthIndex = target.getMonth();
  const firstWeekday = target.getDay();
  const leading = (firstWeekday - weekStartsOn + 7) % 7;
  const daysInMonth = getMonthDays(target);
  const previousMonthDate = new Date(year, monthIndex, 0);
  const daysInPreviousMonth = previousMonthDate.getDate();

  const cells: CalendarMonthCell[] = [];
  for (let i = leading; i > 0; i -= 1) {
    const date = new Date(year, monthIndex - 1, daysInPreviousMonth - i + 1);
    cells.push({
      date,
      day: date.getDate(),
      isoKey: toLocalDateKey(date),
      monthOffset: -1,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push({
      date,
      day,
      isoKey: toLocalDateKey(date),
      monthOffset: 0,
      isCurrentMonth: true,
    });
  }

  while (cells.length < 42) {
    const day = cells.length - (leading + daysInMonth) + 1;
    const date = new Date(year, monthIndex + 1, day);
    cells.push({
      date,
      day: date.getDate(),
      isoKey: toLocalDateKey(date),
      monthOffset: 1,
      isCurrentMonth: false,
    });
  }

  const weeks: CalendarMonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return { month: target, weeks };
}

// DEEPS
export function sortDeep(value: any): any {
  if (isArray(value)) {
    return value.map(sortDeep);
  }

  if (isObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortDeep(value[key]);
        return acc;
      }, {} as Record<string | number | symbol, any>);
  }

  return value;
}

export function isDeepEqual(a: any, b: any): boolean {
  return JSON.stringify(sortDeep(a)) === JSON.stringify(sortDeep(b));
}

// PATH resolvers
export function getPathSegmentReady(segment = '') {
  const match = segment.match(/^([^[]+)?(?:\[(\d+)\])?$/);
  if (!match) return { property: undefined, index: undefined };
  return { property: match[1], index: match[2] ? Number(match[2]) : undefined };
}

export function getValueFromPath(path: string, data: any): any {
  if (!path) return undefined;
  function builder(path: string, data: any): any {
    const [segment, ...rest] = path.split('/');
    const restPath = rest.join('/');
    const { property, index } = getPathSegmentReady(segment);
    if (property !== undefined) {
      return builder(restPath, data?.[property]);
    }
    if (index !== undefined) {
      return builder(restPath, data?.[index]);
    }
    return data;
  }
  return builder(path, data);
}

export function mergeValueByPath(path: string, value: any, data: any) {
  function builder(path: string, value: any, data: any): any {
    const [segment, ...rest] = path.split('/');
    const restPath = rest.join('/');
    const { property, index } = getPathSegmentReady(segment);
    if (isString(property) || isNumber(property)) {
      const maybeIndex = Number(property);
      if (isInteger(maybeIndex) && isArray(data)) {
        const prev = [...data];
        prev[maybeIndex] = builder(restPath, value, prev[maybeIndex]);
        return prev;
      }
      const prev = data?.[property];
      const child = builder(restPath, value, prev);
      if (isObject(child) && isObject(prev) && isObject(data)) {
        return { ...data, [property]: { ...prev, ...child } };
      } else if (isObject(child) && isObject(prev)) {
        return { [property]: { ...prev, ...child } };
      } else if (isObject(data)) {
        return { ...data, [property]: child };
      }
      return { [property]: child };
    }
    if (isInteger(index)) {
      const prev = isArray(data) ? [...data] : [];
      prev[index] = builder(restPath, value, prev[index]);
      return prev;
    }
    return value;
  }

  return builder(path, value, data);
}

export function setValueByPath(path: string, value: any, data: any) {
  function builder(path: string, value: any, data: any): any {
    const [segment, ...rest] = path.split('/');
    const restPath = rest.join('/');
    const { property, index } = getPathSegmentReady(segment);
    if (isString(property) || isNumber(property)) {
      const maybeIndex = Number(property);
      if (isInteger(maybeIndex) && isArray(data)) {
        const prev = [...data];
        prev[maybeIndex] = builder(restPath, value, prev[maybeIndex]);
        return prev;
      }
      const prev = data?.[property];
      const child = builder(restPath, value, prev);
      if (isObject(data)) {
        return { ...data, [property]: child };
      }
      return { [property]: child };
    }
    if (index !== undefined) {
      const prev = isArray(data) ? [...data] : [];
      prev[index] = builder(restPath, value, prev[index]);
      return prev;
    }
    return value;
  }

  return builder(path, value, data);
}

export function removePathParts(
  path: string,
  count: number = 1,
  fromStart: boolean = true,
): string {
  if (!path) return '/';
  const m = path.match(/^([^?#]*)([\s\S]*)$/);
  const base = (m?.[1] ?? '') || '/';
  const suffix = m?.[2] ?? '';
  const segments = base.split('/').filter(Boolean);
  const n = Math.max(0, Math.min(segments.length, Math.floor(count)));
  const trimmed = fromStart ? segments.slice(n) : segments.slice(0, segments.length - n);
  const body = trimmed.join('/');
  return (body ? `/${body}` : '/') + suffix;
}
