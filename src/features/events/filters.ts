/**
 * Discover filtering and grouping — Spec 002 REQ-004, 006, 021–028.
 */
import { dateWindow, overlaps, zonedDayKey } from './time';
import type { EventSummary, Filters } from './types';

export const NO_FILTERS: Filters = {
  date: 'any',
  categories: [],
  languages: [],
  price: 'any',
  soloOnly: false,
};

/** Listable on Discover: not ended, and not cancelled once started (REQ-004, REQ-006). */
export function isListable(event: EventSummary, now: Date): boolean {
  if (event.endsAt <= now) return false;
  if (event.status === 'cancelled' && event.startsAt <= now) return false;
  return true;
}

/** AND across filter types, OR within a type (REQ-027). */
export function applyFilters(events: EventSummary[], filters: Filters, now: Date, timeZone: string): EventSummary[] {
  const window = dateWindow(filters.date, now, timeZone);
  return events.filter(
    (event) =>
      isListable(event, now) &&
      (window === null || overlaps(event, window)) &&
      (filters.categories.length === 0 || filters.categories.includes(event.category)) &&
      (filters.languages.length === 0 || event.languages.some((language) => filters.languages.includes(language))) &&
      (filters.price === 'any' || event.price.type === filters.price) &&
      (!filters.soloOnly || event.soloFriendly),
  );
}

export function activeFilterCount(filters: Filters): number {
  return (
    Number(filters.date !== 'any') +
    Number(filters.categories.length > 0) +
    Number(filters.languages.length > 0) +
    Number(filters.price !== 'any') +
    Number(filters.soloOnly)
  );
}

export interface DaySection {
  key: string;
  /** An instant inside the day, used for the header label. */
  day: Date;
  data: EventSummary[];
}

/** Groups events by their day in the city's time zone; events in progress count as today (REQ-002). */
export function groupByDay(events: EventSummary[], now: Date, timeZone: string): DaySection[] {
  const sorted = [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const sections: DaySection[] = [];
  for (const event of sorted) {
    const anchor = event.startsAt < now ? now : event.startsAt;
    const key = zonedDayKey(anchor, timeZone);
    const last = sections[sections.length - 1];
    if (last && last.key === key) {
      last.data.push(event);
    } else {
      sections.push({ key, day: anchor, data: [event] });
    }
  }
  return sections;
}
