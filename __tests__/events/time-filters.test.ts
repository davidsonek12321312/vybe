/**
 * Time-zone logic and filters — Spec 002 S2–S5, S32 (REQ-002, 005, 007, 022–027, 051).
 */
import { NO_FILTERS, activeFilterCount, applyFilters, groupByDay, isListable } from '@/features/events/filters';
import {
  addZonedDays,
  dateWindow,
  formatTime,
  isHappeningNow,
  offsetMinutes,
  startOfZonedDay,
  zonedDayKey,
  zonedParts,
} from '@/features/events/time';
import type { EventSummary, Filters } from '@/features/events/types';

const DA_NANG = 'Asia/Ho_Chi_Minh';

function event(partial: Partial<EventSummary> & Pick<EventSummary, 'slug' | 'startsAt' | 'endsAt'>): EventSummary {
  return {
    id: partial.slug,
    status: 'published',
    title: partial.slug,
    city: { slug: 'da-nang', name: 'Da Nang', timeZone: DA_NANG },
    category: 'social',
    languages: ['en'],
    area: 'My Khe',
    venue: { status: 'tbc', name: null },
    price: { type: 'free' },
    soloFriendly: false,
    ageRestriction: null,
    coverImageUrl: null,
    materialChangedAt: null,
    isSample: false,
    ...partial,
  };
}

// Fixture F1 (requirements §4): "now" = Thu 3 Dec 2026 12:00 Da Nang = 05:00Z.
const NOW = new Date('2026-12-03T05:00:00Z');
const F1 = [
  event({ slug: 'a', startsAt: new Date('2026-12-03T12:00:00Z'), endsAt: new Date('2026-12-03T15:00:00Z'), languages: ['en', 'vi'], soloFriendly: true }),
  event({ slug: 'b', startsAt: new Date('2026-12-05T10:00:00Z'), endsAt: new Date('2026-12-05T13:00:00Z'), category: 'beach_outdoors', languages: ['en', 'vi', 'ru'], soloFriendly: true }),
  event({ slug: 'c', startsAt: new Date('2026-12-06T01:00:00Z'), endsAt: new Date('2026-12-06T03:00:00Z'), category: 'sports_fitness', languages: ['ru'], price: { type: 'paid', vnd: 100000 } }),
  event({ slug: 'd', startsAt: new Date('2026-12-07T12:00:00Z'), endsAt: new Date('2026-12-07T14:00:00Z'), category: 'language_exchange', languages: ['vi'], price: { type: 'paid', vnd: 50000 } }),
];

const slugs = (filters: Partial<Filters>, now = NOW) =>
  applyFilters(F1, { ...NO_FILTERS, ...filters }, now, DA_NANG).map((e) => e.slug).join(',');

describe('time zone helpers (REQ-051, no constants)', () => {
  test('offsets for UTC+07:00, UTC+09:00 and a daylight-saving zone', () => {
    expect(offsetMinutes(NOW, DA_NANG)).toBe(420);
    expect(offsetMinutes(NOW, 'Asia/Tokyo')).toBe(540);
    expect(offsetMinutes(new Date('2026-01-15T12:00:00Z'), 'Europe/Berlin')).toBe(60);
    expect(offsetMinutes(new Date('2026-07-15T12:00:00Z'), 'Europe/Berlin')).toBe(120);
  });

  test('local midnight and day keys follow the city', () => {
    expect(startOfZonedDay(NOW, DA_NANG).toISOString()).toBe('2026-12-02T17:00:00.000Z');
    expect(startOfZonedDay(NOW, 'Asia/Tokyo').toISOString()).toBe('2026-12-02T15:00:00.000Z');
    expect(zonedDayKey(new Date('2026-12-03T18:30:00Z'), DA_NANG)).toBe('2026-12-04');
    expect(zonedDayKey(new Date('2026-12-03T18:30:00Z'), 'Europe/Berlin')).toBe('2026-12-03');
  });

  test('adding days across a daylight-saving change keeps local midnight', () => {
    // Europe/Berlin moves to summer time on Sun 29 Mar 2026.
    const sat = new Date('2026-03-28T10:00:00Z');
    expect(addZonedDays(sat, 1, 'Europe/Berlin').toISOString()).toBe('2026-03-28T23:00:00.000Z');
    expect(addZonedDays(sat, 2, 'Europe/Berlin').toISOString()).toBe('2026-03-29T22:00:00.000Z');
  });

  test('weekday and wall clock come from the city, not the device (S3)', () => {
    expect(zonedParts(NOW, DA_NANG)).toMatchObject({ year: 2026, month: 12, day: 3, hour: 12, weekday: 4 });
    expect(formatTime(F1[1].startsAt, 'en', DA_NANG)).toBe('17:00');
  });
});

describe('date windows (REQ-022)', () => {
  test('This weekend on a Saturday is Saturday and Sunday (S5)', () => {
    const saturday = new Date('2026-12-05T05:00:00Z');
    const window = dateWindow('weekend', saturday, DA_NANG);
    expect(window?.start.toISOString()).toBe('2026-12-04T17:00:00.000Z');
    expect(window?.end.toISOString()).toBe('2026-12-06T17:00:00.000Z');
  });

  test('This weekend on a Sunday is only Sunday', () => {
    const sunday = new Date('2026-12-06T05:00:00Z');
    const window = dateWindow('weekend', sunday, DA_NANG);
    expect(window?.start.toISOString()).toBe('2026-12-05T17:00:00.000Z');
    expect(window?.end.toISOString()).toBe('2026-12-06T17:00:00.000Z');
  });

  test('Any date has no window', () => {
    expect(dateWindow('any', NOW, DA_NANG)).toBeNull();
  });
});

describe('filters on fixture F1 (S4)', () => {
  test.each([
    [{ date: 'today' as const }, 'a'],
    [{ date: 'weekend' as const }, 'b,c'],
    [{ date: 'next7' as const }, 'a,b,c,d'],
    [{ categories: ['beach_outdoors' as const, 'sports_fitness' as const] }, 'b,c'],
    [{ languages: ['ru' as const] }, 'b,c'],
    [{ languages: ['vi' as const], price: 'paid' as const }, 'd'],
    [{ soloOnly: true }, 'a,b'],
    [{ languages: ['ru' as const], categories: ['language_exchange' as const] }, ''],
  ])('%j → %s', (filters, expected) => {
    expect(slugs(filters)).toBe(expected);
  });

  test('This weekend on Saturday excludes Monday (S5)', () => {
    expect(slugs({ date: 'weekend' }, new Date('2026-12-05T05:00:00Z'))).toBe('b,c');
  });

  test('NO_FILTERS returns every listable event and counts zero filters', () => {
    expect(slugs({})).toBe('a,b,c,d');
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...NO_FILTERS, soloOnly: true, languages: ['vi'] })).toBe(2);
  });
});

describe('listing rules (REQ-004, 005, 006)', () => {
  test('ended events and started cancelled events are not listed', () => {
    const at = new Date('2026-12-03T13:00:00Z');
    expect(isListable(F1[0], at)).toBe(true);
    expect(isListable(F1[0], new Date('2026-12-03T15:00:00Z'))).toBe(false);
    const cancelled = { ...F1[0], status: 'cancelled' as const };
    expect(isListable(cancelled, new Date('2026-12-03T11:59:00Z'))).toBe(true);
    expect(isListable(cancelled, new Date('2026-12-03T12:01:00Z'))).toBe(false);
  });

  test('happening now (S2)', () => {
    expect(isHappeningNow(F1[0], new Date('2026-12-03T12:30:00Z'))).toBe(true);
    expect(isHappeningNow(F1[0], NOW)).toBe(false);
  });

  test('groups by Da Nang day; an event in progress counts as today', () => {
    const at = new Date('2026-12-03T12:30:00Z');
    const sections = groupByDay(F1, at, DA_NANG);
    expect(sections.map((s) => s.key)).toEqual(['2026-12-03', '2026-12-05', '2026-12-06', '2026-12-07']);
  });
});

describe('unsupported time zone (CR-10)', () => {
  test('a bad zone id does not throw; it falls back to UTC', () => {
    const at = new Date('2026-12-03T05:00:00Z');
    expect(() => zonedParts(at, 'Not/AZone')).not.toThrow();
    expect(zonedParts(at, 'Not/AZone').hour).toBe(5);
    expect(() => formatTime(at, 'en', 'Not/AZone')).not.toThrow();
    expect(formatTime(at, 'en', 'Not/AZone')).toBe('05:00');
  });
});
