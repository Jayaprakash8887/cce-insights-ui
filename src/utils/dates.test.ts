import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  toUtcString,
  toStartOfDayISO,
  toEndOfDayISO,
} from './dates';

describe('formatDate', () => {
  it('renders in UTC regardless of local timezone', () => {
    // 20:00Z must stay on Jun 22 even in ahead-of-UTC zones (would slip to Jun 23 if local).
    expect(formatDate('2026-06-22T20:00:00Z')).toBe('Jun 22, 2026');
  });
});

describe('formatDateTime', () => {
  it('renders date and 24h time in UTC', () => {
    expect(formatDateTime('2026-06-22T20:05:00Z')).toBe('Jun 22, 2026, 20:05');
  });
});

describe('toUtcString', () => {
  it('returns the ISO-8601 representation of a Date', () => {
    const date = new Date('2026-06-22T20:00:00Z');
    expect(toUtcString(date)).toBe('2026-06-22T20:00:00.000Z');
  });
});

describe('day-boundary ISO helpers', () => {
  it('expands a YYYY-MM-DD to start and end of the UTC day', () => {
    expect(toStartOfDayISO('2026-06-22')).toBe('2026-06-22T00:00:00Z');
    expect(toEndOfDayISO('2026-06-22')).toBe('2026-06-22T23:59:59Z');
  });
});
