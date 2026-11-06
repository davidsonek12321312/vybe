/**
 * Time-zone aware date logic — Spec 002 REQ-002, 005, 007, 022, 051; design A8.
 * Every function takes the city's IANA time zone; nothing is hard-coded.
 */
import type { DateFilter, EventSummary } from './types';

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const map: Record<string, string> = {};
  for (const part of partsFormatter(timeZone).formatToParts(date)) {
    map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAYS.indexOf(map.weekday),
  };
}

/** Offset of the time zone from UTC at this instant, in minutes (UTC+07:00 → 420). */
export function offsetMinutes(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const wholeSeconds = Math.floor(date.getTime() / 1000) * 1000;
  return Math.round((wallClockAsUtc - wholeSeconds) / 60000);
}

/** The instant of local midnight for a calendar day (day may overflow, e.g. 32). */
export function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day);
  let instant = guess - offsetMinutes(new Date(guess), timeZone) * 60000;
  const corrected = guess - offsetMinutes(new Date(instant), timeZone) * 60000;
  if (corrected !== instant) {
    instant = corrected;
  }
  return new Date(instant);
}

export function startOfZonedDay(date: Date, timeZone: string): Date {
  const p = zonedParts(date, timeZone);
  return zonedMidnight(p.year, p.month, p.day, timeZone);
}

/** Local midnight `days` days after the calendar day of `date`. */
export function addZonedDays(date: Date, days: number, timeZone: string): Date {
  const p = zonedParts(date, timeZone);
  return zonedMidnight(p.year, p.month, p.day + days, timeZone);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function zonedDayKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export interface TimeWindow {
  start: Date;
  end: Date;
}

/** Date filter window in the city's time zone (REQ-022). `null` means no date limit. */
export function dateWindow(filter: DateFilter, now: Date, timeZone: string): TimeWindow | null {
  switch (filter) {
    case 'any':
      return null;
    case 'today':
      return { start: startOfZonedDay(now, timeZone), end: addZonedDays(now, 1, timeZone) };
    case 'tomorrow':
      return { start: addZonedDays(now, 1, timeZone), end: addZonedDays(now, 2, timeZone) };
    case 'next7':
      return { start: now, end: addZonedDays(now, 7, timeZone) };
    case 'weekend': {
      const weekday = zonedParts(now, timeZone).weekday;
      if (weekday === 6) {
        return { start: startOfZonedDay(now, timeZone), end: addZonedDays(now, 2, timeZone) };
      }
      if (weekday === 0) {
        return { start: startOfZonedDay(now, timeZone), end: addZonedDays(now, 1, timeZone) };
      }
      const untilSaturday = 6 - weekday;
      return {
        start: addZonedDays(now, untilSaturday, timeZone),
        end: addZonedDays(now, untilSaturday + 2, timeZone),
      };
    }
  }
}

export function overlaps(event: Pick<EventSummary, 'startsAt' | 'endsAt'>, window: TimeWindow): boolean {
  return event.startsAt < window.end && event.endsAt > window.start;
}

export function isHappeningNow(event: Pick<EventSummary, 'startsAt' | 'endsAt'>, now: Date): boolean {
  return event.startsAt <= now && now < event.endsAt;
}

export function hasEnded(event: Pick<EventSummary, 'endsAt'>, now: Date): boolean {
  return event.endsAt <= now;
}

/** True when the device clock shows the same offset as the city right now (REQ-007). */
export function deviceUsesCityTime(now: Date, timeZone: string): boolean {
  return offsetMinutes(now, timeZone) === -now.getTimezoneOffset();
}

const INTL_LOCALES: Record<string, string> = { en: 'en-GB', vi: 'vi-VN', ru: 'ru-RU' };
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, timeZone: string, kind: 'time' | 'day' | 'long' | 'stamp'): Intl.DateTimeFormat {
  const intlLocale = INTL_LOCALES[locale] ?? 'en-GB';
  const key = `${intlLocale}|${timeZone}|${kind}`;
  let f = formatters.get(key);
  if (!f) {
    const options: Intl.DateTimeFormatOptions =
      kind === 'time'
        ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
        : kind === 'day'
          ? { weekday: 'short', day: 'numeric', month: 'short' }
          : kind === 'long'
            ? { weekday: 'long', day: 'numeric', month: 'long' }
            : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    f = new Intl.DateTimeFormat(intlLocale, { ...options, timeZone });
    formatters.set(key, f);
  }
  return f;
}

export function formatTime(date: Date, locale: string, timeZone: string): string {
  return formatter(locale, timeZone, 'time').format(date);
}

export function formatDay(date: Date, locale: string, timeZone: string): string {
  return formatter(locale, timeZone, 'day').format(date);
}

export function formatLongDate(date: Date, locale: string, timeZone: string): string {
  return formatter(locale, timeZone, 'long').format(date);
}

export function formatStamp(date: Date, locale: string, timeZone: string): string {
  return formatter(locale, timeZone, 'stamp').format(date);
}
