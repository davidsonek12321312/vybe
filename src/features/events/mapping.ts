/**
 * Validates Data API rows and maps them to domain objects — Spec 002 REQ-030,
 * REQ-037. Invalid rows return null and are left out of the UI.
 */
import { hostOf, isAllowedMapsUrl, isAllowedRegistrationUrl, isHttpsUrl } from './links';
import {
  EVENT_CATEGORIES,
  EVENT_LANGUAGES,
  isValidSlug,
  type City,
  type EventCategory,
  type EventDetail,
  type EventLanguage,
  type EventSummary,
} from './types';

type Row = Record<string, unknown>;

export interface MappingOptions {
  /** Host allowed for cover images (the Supabase project host); null allows none. */
  coverHost: string | null;
  isSample?: boolean;
}

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function instant(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isCategory(value: unknown): value is EventCategory {
  return typeof value === 'string' && (EVENT_CATEGORIES as readonly string[]).includes(value);
}

function isLanguage(value: unknown): value is EventLanguage {
  return typeof value === 'string' && (EVENT_LANGUAGES as readonly string[]).includes(value);
}

export function toCity(value: unknown): City | null {
  if (!isRow(value)) return null;
  const slug = value.slug;
  const name = text(value.name);
  const timeZone = text(value.time_zone);
  if (!isValidSlug(slug) || !name || !timeZone) return null;
  return { slug, name, timeZone };
}

export function toEventSummary(value: unknown, options: MappingOptions): EventSummary | null {
  if (!isRow(value)) return null;
  const id = text(value.id);
  const slug = value.slug;
  const title = text(value.title);
  const area = text(value.area);
  const city = toCity(value.city);
  const startsAt = instant(value.starts_at);
  const endsAt = instant(value.ends_at);
  const status = value.status;
  const languages = Array.isArray(value.languages) ? value.languages : [];

  if (!id || !isValidSlug(slug) || !title || !area || !city || !startsAt || !endsAt) return null;
  if (endsAt <= startsAt) return null;
  if (status !== 'published' && status !== 'cancelled') return null;
  // Amendment v0.5 (REQ-037): unknown category or language values use a safe fallback; the event is kept.
  if (typeof value.category !== 'string' || value.category === '') return null;
  const category: EventCategory = isCategory(value.category) ? value.category : 'other';
  if (languages.length === 0 || !languages.every((code) => typeof code === 'string' && code !== '')) return null;
  const knownLanguages: EventLanguage[] = languages.map((code) => (isLanguage(code) ? code : 'other'));

  let price: EventSummary['price'];
  if (value.price_type === 'free') {
    price = { type: 'free' };
  } else if (value.price_type === 'paid' && typeof value.price_vnd === 'number' && value.price_vnd > 0) {
    price = { type: 'paid', vnd: value.price_vnd };
  } else {
    return null;
  }

  const venueStatus = value.venue_status === 'confirmed' ? 'confirmed' : 'tbc';
  const age = value.age_restriction;
  const cover = text(value.cover_image_url);
  const coverAllowed =
    cover !== null && isHttpsUrl(cover) && options.coverHost !== null && hostOf(cover) === options.coverHost;

  return {
    id,
    slug,
    status,
    title,
    city,
    category,
    languages: knownLanguages,
    startsAt,
    endsAt,
    area,
    venue: { status: venueStatus, name: text(value.venue_name) },
    price,
    // REQ-030: the badge needs concrete solo-support details.
    soloFriendly: value.solo_friendly === true && text(value.solo_details) !== null,
    ageRestriction: age === 16 || age === 18 || age === 21 ? age : null,
    coverImageUrl: coverAllowed ? cover : null,
    materialChangedAt: instant(value.material_changed_at),
    isSample: options.isSample === true,
  };
}

export function toEventDetail(value: unknown, options: MappingOptions): EventDetail | null {
  const summary = toEventSummary(value, options);
  if (!summary || !isRow(value)) return null;
  const description = text(value.description);
  const organizerName = text(value.organizer_name);
  const updatedAt = instant(value.updated_at) ?? summary.startsAt;
  if (!description || !organizerName) return null;

  const maps = text(value.maps_url);
  const registration = text(value.registration_url);
  return {
    ...summary,
    description,
    whatToExpect: text(value.what_to_expect),
    venueAddress: text(value.venue_address),
    mapsUrl: summary.venue.status === 'confirmed' && isAllowedMapsUrl(maps) ? maps : null,
    paymentNote: text(value.payment_note),
    organizerName,
    accessibilityNotes: text(value.accessibility_notes),
    soloDetails: summary.soloFriendly ? text(value.solo_details) : null,
    cancellationNote: text(value.cancellation_note),
    changeNote: text(value.change_note),
    registrationUrl: isAllowedRegistrationUrl(registration) ? registration : null,
    updatedAt,
  };
}
