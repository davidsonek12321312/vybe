/**
 * Filters in the URL — Spec 002 REQ-028 (C): on web, Discover's filters are
 * reflected in the query string, so a filtered view can be shared or
 * bookmarked ("/?date=weekend&solo=1&lang=en,ru").
 *
 * The query string is untrusted input: unknown keys and values are dropped,
 * duplicates are removed, and lists are capped at the size of their option
 * set, so a crafted URL can only ever select real filter options.
 */
import { NO_FILTERS } from './filters';
import { EVENT_CATEGORIES, EVENT_LANGUAGES, type DateFilter, type EventCategory, type EventLanguage, type Filters, type PriceFilter } from './types';

const DATES: readonly DateFilter[] = ['any', 'today', 'tomorrow', 'weekend', 'next7'];
const PRICES: readonly PriceFilter[] = ['any', 'free', 'paid'];

/** The query keys Discover owns. Anything else in Discover's URL is cleared. */
export const FILTER_PARAM_KEYS = ['date', 'solo', 'lang', 'price', 'cat'] as const;

export type FilterParams = Partial<Record<(typeof FILTER_PARAM_KEYS)[number], string>>;

type RawParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim().toLowerCase();
}

function pick<T extends string>(allowed: readonly T[], raw: string | undefined): T | undefined {
  return allowed.find((option) => option === raw);
}

function pickList<T extends string>(allowed: readonly T[], raw: string | undefined): T[] {
  if (!raw) return [];
  const wanted = new Set(raw.split(',').map((part) => part.trim().toLowerCase()));
  // Keep the option order, so the same choice always gives the same URL.
  return allowed.filter((option) => wanted.has(option));
}

export function filtersFromParams(params: RawParams): Filters {
  return {
    date: pick(DATES, single(params.date)) ?? NO_FILTERS.date,
    soloOnly: single(params.solo) === '1',
    languages: pickList<EventLanguage>(EVENT_LANGUAGES, single(params.lang)),
    price: pick(PRICES, single(params.price)) ?? NO_FILTERS.price,
    categories: pickList<EventCategory>(EVENT_CATEGORIES as readonly EventCategory[], single(params.cat)),
  };
}

/** Every Discover key, with `undefined` for a filter at its default (removes it from the URL). */
export function filtersToParams(filters: Filters): FilterParams {
  return {
    date: filters.date === 'any' ? undefined : filters.date,
    solo: filters.soloOnly ? '1' : undefined,
    lang: filters.languages.length > 0 ? EVENT_LANGUAGES.filter((l) => filters.languages.includes(l)).join(',') : undefined,
    price: filters.price === 'any' ? undefined : filters.price,
    cat:
      filters.categories.length > 0
        ? EVENT_CATEGORIES.filter((c) => filters.categories.includes(c)).join(',')
        : undefined,
  };
}

/**
 * Query keys in Discover's URL that Discover does not own and that still hold
 * a value (for example a `slug` left by a deep link). Cleared keys stay in
 * Expo Router's params as `undefined`; the hash and the router's internal
 * keys are not query parameters.
 */
export function foreignParamKeys(params: RawParams): string[] {
  return Object.keys(params).filter(
    (key) =>
      params[key] != null &&
      key !== '#' &&
      !key.startsWith('__internal') &&
      !(FILTER_PARAM_KEYS as readonly string[]).includes(key),
  );
}

/** A stable string for the filters a URL selects: equal strings, equal filters. */
export function filtersKey(params: RawParams): string {
  const canonical = filtersToParams(filtersFromParams(params));
  return FILTER_PARAM_KEYS.map((key) => `${key}=${canonical[key] ?? ''}`).join('&');
}

/** The filters a `filtersKey` string stands for (its values are whitelisted, so no escaping). */
export function filtersFromKey(key: string): Filters {
  const params: RawParams = {};
  for (const pair of key.split('&')) {
    const [name, value] = pair.split('=');
    if (name && value) params[name] = value;
  }
  return filtersFromParams(params);
}
