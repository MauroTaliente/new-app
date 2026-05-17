import { describe, it, expect } from 'vitest';
import {
  buildCalendarMonth,
  formatTimestamp,
  getMonthDays,
  getMonthEnd,
  getMonthStart,
  isAfterLocalDay,
  isBeforeLocalDay,
  toIsoDateTime,
  toLocalDateKey,
  toStartOfDay,
} from '../src/shared.js';

describe('formatTimestamp', () => {
  it('formats a fixed instant per mode (es-AR locale)', () => {
    const iso = '2026-04-15T15:30:45.000Z';
    expect(formatTimestamp(iso, 'date', 'es-AR')).toMatch(/15/);
    expect(formatTimestamp(iso, 'date', 'es-AR')).toMatch(/2026/);
    expect(formatTimestamp(iso, 'time', 'es-AR')).toMatch(/\d{1,2}:\d{2}/);
    expect(formatTimestamp(iso, 'full', 'es-AR').length).toBeGreaterThan(10);
  });
});

describe('month boundaries', () => {
  it('getMonthStart, getMonthEnd and getMonthDays are consistent', () => {
    const april = new Date(2026, 3, 15);
    const start = getMonthStart(april);
    const end = getMonthEnd(april);
    expect(toLocalDateKey(start)).toBe('2026-04-01');
    expect(toLocalDateKey(end)).toBe('2026-04-30');
    expect(getMonthDays(april)).toBe(30);
  });

  it('toIsoDateTime returns empty string for invalid input', () => {
    expect(toIsoDateTime('not-a-date')).toBe('');
    expect(toIsoDateTime(new Date(2026, 3, 15))).toContain('2026');
  });
});

describe('local day comparison', () => {
  it('isBeforeLocalDay and isAfterLocalDay compare calendar days only', () => {
    const morning = new Date(2026, 3, 10, 8, 0, 0);
    const evening = new Date(2026, 3, 10, 20, 0, 0);
    const nextDay = new Date(2026, 3, 11, 1, 0, 0);

    expect(isBeforeLocalDay(morning, evening)).toBe(false);
    expect(isAfterLocalDay(morning, nextDay)).toBe(false);
    expect(isBeforeLocalDay(morning, nextDay)).toBe(true);
    expect(isAfterLocalDay(nextDay, morning)).toBe(true);
  });

  it('toStartOfDay strips time components', () => {
    const withTime = new Date(2026, 3, 10, 23, 59, 59);
    expect(toStartOfDay(withTime).getHours()).toBe(0);
    expect(toStartOfDay(withTime).getMinutes()).toBe(0);
  });
});

describe('buildCalendarMonth metadata', () => {
  it('marks leading and trailing cells outside the current month', () => {
    const { weeks } = buildCalendarMonth(new Date(2026, 3, 1), 1);
    const flat = weeks.flat();
    expect(flat.some((cell) => cell.monthOffset === -1)).toBe(true);
    expect(flat.some((cell) => cell.monthOffset === 0 && cell.isCurrentMonth)).toBe(true);
    expect(flat.some((cell) => cell.monthOffset === 1)).toBe(true);
  });

  it('supports weekStartsOn Sunday (0)', () => {
    const { weeks } = buildCalendarMonth(new Date(2026, 3, 1), 0);
    expect(weeks[0]?.[0]?.date.getDay()).toBe(0);
  });
});
