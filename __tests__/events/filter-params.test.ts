/**
 * Filters in the URL — Spec 002 REQ-028 (C). The query string is untrusted:
 * only real filter options survive parsing.
 */
import { NO_FILTERS } from '@/features/events/filters';
import { filtersFromKey, filtersFromParams, filtersKey, filtersToParams, foreignParamKeys } from '@/features/events/filter-params';
import type { Filters } from '@/features/events/types';

describe('filters in the URL', () => {
  test('no params → no filters', () => {
    expect(filtersFromParams({})).toEqual(NO_FILTERS);
  });

  test('a full set round-trips', () => {
    const filters: Filters = {
      date: 'weekend',
      soloOnly: true,
      languages: ['en', 'ru'],
      price: 'free',
      categories: ['beach_outdoors', 'food_drink'],
    };
    const params = filtersToParams(filters);
    expect(params).toEqual({ date: 'weekend', solo: '1', lang: 'en,ru', price: 'free', cat: 'beach_outdoors,food_drink' });
    expect(filtersFromParams(params)).toEqual(filters);
  });

  test('defaults clear their keys', () => {
    expect(filtersToParams(NO_FILTERS)).toEqual({ date: undefined, solo: undefined, lang: undefined, price: undefined, cat: undefined });
  });

  test('the same choice always gives the same URL, whatever the click order', () => {
    const a = filtersToParams({ ...NO_FILTERS, languages: ['ru', 'en'] });
    const b = filtersToParams({ ...NO_FILTERS, languages: ['en', 'ru'] });
    expect(a.lang).toBe('en,ru');
    expect(b.lang).toBe(a.lang);
  });

  test('unknown, malformed and hostile values are dropped', () => {
    const parsed = filtersFromParams({
      date: 'yesterday',
      solo: 'true',
      lang: 'en,xx,<script>,EN,en',
      price: 'cheap',
      cat: 'social,nightlife,other,__proto__',
    });
    expect(parsed).toEqual({ date: 'any', soloOnly: false, languages: ['en'], price: 'any', categories: ['social', 'nightlife'] });
  });

  test('a repeated key uses its first value', () => {
    expect(filtersFromParams({ date: ['today', 'weekend'] }).date).toBe('today');
  });

  test('foreign keys are reported so Discover can clear them', () => {
    expect(foreignParamKeys({ slug: 'beach-social-001', date: 'today' })).toEqual(['slug']);
  });

  test('cleared, hash and router-internal keys are not foreign', () => {
    expect(foreignParamKeys({ slug: undefined, '#': 'top', __internal_expo_router_state: 'x', lang: 'ru' })).toEqual([]);
  });

  test('the filters key is the same for equal selections, whatever the spelling', () => {
    expect(filtersKey({ lang: 'ru,en', solo: '1' })).toBe(filtersKey({ solo: '1', lang: 'EN,ru,xx' }));
    expect(filtersKey({})).not.toBe(filtersKey({ solo: '1' }));
  });

  test('a filters key reads back as the filters it was made from', () => {
    const params = { date: 'weekend', solo: '1', lang: 'en,ru', price: 'paid', cat: 'social,workshops' };
    expect(filtersFromKey(filtersKey(params))).toEqual(filtersFromParams(params));
    expect(filtersFromKey(filtersKey({}))).toEqual(NO_FILTERS);
  });
});
