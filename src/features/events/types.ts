/**
 * Event Discovery domain types — Spec 002.
 */
export const EVENT_CATEGORIES = [
  'social',
  'beach_outdoors',
  'sports_fitness',
  'food_drink',
  'language_exchange',
  'arts_culture',
  'workshops',
  'nightlife',
] as const;
/** `other` is only a display fallback for values this client does not know (amendment v0.5); it is not a filter. */
export type EventCategory = (typeof EVENT_CATEGORIES)[number] | 'other';

export const EVENT_LANGUAGES = ['en', 'vi', 'ru', 'other'] as const;
export type EventLanguage = (typeof EVENT_LANGUAGES)[number];

export type EventStatus = 'published' | 'cancelled';

export interface City {
  slug: string;
  name: string;
  /** IANA time zone, for example "Asia/Ho_Chi_Minh" (ADR-0016). */
  timeZone: string;
}

export type Price = { type: 'free' } | { type: 'paid'; vnd: number };

export interface EventSummary {
  id: string;
  slug: string;
  status: EventStatus;
  title: string;
  city: City;
  category: EventCategory;
  languages: EventLanguage[];
  startsAt: Date;
  endsAt: Date;
  area: string;
  venue: { status: 'confirmed' | 'tbc'; name: string | null };
  price: Price;
  soloFriendly: boolean;
  ageRestriction: 16 | 18 | 21 | null;
  coverImageUrl: string | null;
  materialChangedAt: Date | null;
  /** True only for the fictional sample data source (REQ-009). */
  isSample: boolean;
}

export interface EventDetail extends EventSummary {
  description: string;
  whatToExpect: string | null;
  venueAddress: string | null;
  mapsUrl: string | null;
  paymentNote: string | null;
  organizerName: string;
  accessibilityNotes: string | null;
  soloDetails: string | null;
  cancellationNote: string | null;
  changeNote: string | null;
  /** Temporary Google Forms bridge (REQ-053). */
  registrationUrl: string | null;
  updatedAt: Date;
}

export type DateFilter = 'any' | 'today' | 'tomorrow' | 'weekend' | 'next7';
export type PriceFilter = 'any' | 'free' | 'paid';

export interface Filters {
  date: DateFilter;
  categories: EventCategory[];
  languages: EventLanguage[];
  price: PriceFilter;
  soloOnly: boolean;
}

export type LoadErrorKind = 'offline' | 'timeout' | 'server' | 'config';

export class LoadError extends Error {
  readonly kind: LoadErrorKind;

  constructor(kind: LoadErrorKind) {
    super(`Event data could not be loaded (${kind})`);
    this.name = 'LoadError';
    this.kind = kind;
  }
}

export interface EventRepository {
  listUpcoming(citySlug: string, now: Date, signal?: AbortSignal): Promise<EventSummary[]>;
  getBySlug(slug: string, signal?: AbortSignal): Promise<EventDetail | null>;
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 3 && value.length <= 80 && SLUG_PATTERN.test(value);
}
