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

/** Deep-merge `right` onto `left` (right wins on conflicts). Plain values replace. */
export function mergeDeepRight<L, R>(left: L, right: R): L & R {
  if (right === null || right === undefined) return left as L & R;
  if (left === null || left === undefined) return right as L & R;
  if (!isObject(left) || !isObject(right)) return right as L & R;

  const out = { ...left } as Record<string, unknown>;
  for (const key of Object.keys(right)) {
    const rv = (right as Record<string, unknown>)[key];
    const lv = out[key];
    if (isObject(lv) && isObject(rv)) {
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
