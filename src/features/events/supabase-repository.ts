/**
 * Supabase Data API repository — Spec 002 REQ-004, 017, 037, 041, 048, 051.
 * Named columns only (never `*`); RLS decides visibility, and the explicit
 * status filter documents intent and uses the partial indexes.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

import { isListable } from './filters';
import { toEventDetail, toEventSummary, type MappingOptions } from './mapping';
import { LoadError, isValidSlug, type EventRepository, type EventSummary } from './types';

const CITY = 'city:cities!inner(slug, name, time_zone)';

export const LIST_COLUMNS =
  `id, slug, status, title, category, languages, starts_at, ends_at, area, venue_status, venue_name, price_type, price_vnd, solo_friendly, solo_details, age_restriction, cover_image_url, material_changed_at, ${CITY}` as const;

export const DETAIL_COLUMNS =
  `id, slug, status, title, category, languages, starts_at, ends_at, area, venue_status, venue_name, price_type, price_vnd, solo_friendly, solo_details, age_restriction, cover_image_url, material_changed_at, description, what_to_expect, venue_address, maps_url, payment_note, organizer_name, accessibility_notes, cancellation_note, change_note, registration_url, updated_at, ${CITY}` as const;

const VISIBLE: ('published' | 'cancelled')[] = ['published', 'cancelled'];
const OFFLINE_MESSAGE = /fetch failed|failed to fetch|network request failed|networkerror|econnrefused|enotfound|etimedout/i;

export function classifyFailure(error: unknown, status: number | undefined, signal?: AbortSignal): LoadError {
  if (signal?.aborted) return new LoadError('timeout');
  const message =
    typeof error === 'object' && error !== null && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : String(error);
  if (status === 0 || OFFLINE_MESSAGE.test(message)) return new LoadError('offline');
  return new LoadError('server');
}

export function createSupabaseRepository(client: SupabaseClient<Database>, options: MappingOptions): EventRepository {
  return {
    async listUpcoming(citySlug, now, signal) {
      let query = client
        .from('events')
        .select(LIST_COLUMNS)
        .eq('city.slug', citySlug)
        .in('status', VISIBLE)
        .gt('ends_at', now.toISOString())
        .order('starts_at', { ascending: true })
        .limit(200);
      if (signal) query = query.abortSignal(signal);

      let result: Awaited<typeof query>;
      try {
        result = await query;
      } catch (error) {
        throw classifyFailure(error, 0, signal);
      }
      if (result.error) throw classifyFailure(result.error, result.status, signal);

      const rows: unknown[] = Array.isArray(result.data) ? result.data : [];
      return rows
        .map((row) => toEventSummary(row, options))
        .filter((event): event is EventSummary => event !== null && isListable(event, now));
    },

    async getBySlug(slug, signal) {
      if (!isValidSlug(slug)) return null;
      let query = client.from('events').select(DETAIL_COLUMNS).eq('slug', slug).in('status', VISIBLE);
      if (signal) query = query.abortSignal(signal);

      let result: Awaited<ReturnType<typeof query.maybeSingle>>;
      try {
        result = await query.maybeSingle();
      } catch (error) {
        throw classifyFailure(error, 0, signal);
      }
      if (result.error) throw classifyFailure(result.error, result.status, signal);
      if (result.data === null) return null;
      return toEventDetail(result.data, options);
    },
  };
}
