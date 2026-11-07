/**
 * Configuration, links, mapping and the Supabase repository — Spec 002 S11,
 * S16, S17, S18, S24, S25, S34 (REQ-009, 017, 018, 030, 037, 041, 042, 053).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { ConfigError, parseConfig } from '@/config/env';
import { contrastRatio, colors, TEXT_PAIRS } from '@/design/tokens';
import { isAllowedMapsUrl, isAllowedRegistrationUrl, linkify } from '@/features/events/links';
import { toEventDetail, toEventSummary } from '@/features/events/mapping';
import { createSampleRepository } from '@/features/events/sample-repository';
import { DETAIL_COLUMNS, LIST_COLUMNS, createSupabaseRepository } from '@/features/events/supabase-repository';
import { LoadError } from '@/features/events/types';
import type { Database } from '@/lib/database.types';

const PUBLISHABLE = 'sb_publishable_fake_test_value_0000';

/** An unsigned JWT-shaped string with the given payload (test input only). */
function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (text: string) => btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return [JSON.stringify({ alg: 'HS256' }), JSON.stringify(payload), 'signature'].map(encode).join('.');
}

describe('configuration (REQ-009, 041, 042; S24, S25)', () => {
  const base = { allowLocalhost: false };

  test('defaults to the sample source and Da Nang', () => {
    expect(parseConfig(base)).toEqual({ source: 'sample', defaultCity: 'da-nang', siteUrl: null });
  });

  test('live source needs an https URL and a publishable key', () => {
    expect(parseConfig({ ...base, source: 'supabase', supabaseUrl: 'https://vozitoaqntixingqwuiw.supabase.co', publishableKey: PUBLISHABLE })).toMatchObject({
      source: 'supabase',
      supabaseUrl: 'https://vozitoaqntixingqwuiw.supabase.co',
    });
  });

  test.each([
    [{ source: 'other' }, 'invalid_source'],
    [{ source: 'supabase' }, 'missing_url'],
    [{ source: 'supabase', supabaseUrl: 'http://example.com' }, 'invalid_url'],
    [{ source: 'supabase', supabaseUrl: 'https://x.supabase.co' }, 'missing_key'],
    [{ source: 'supabase', supabaseUrl: 'https://x.supabase.co', publishableKey: 'sb_secret_abcdefghijklmnopqrstuvwxyz' }, 'secret_key'],
    [
      {
        source: 'supabase',
        supabaseUrl: 'https://x.supabase.co',
        // Built at runtime so no token-shaped literal sits in the repository.
        publishableKey: fakeJwt({ role: 'service_role' }),
      },
      'secret_key',
    ],
    [{ source: 'supabase', supabaseUrl: 'https://x.supabase.co', publishableKey: 'not-a-key' }, 'invalid_key'],
    [{ defaultCity: 'Da Nang' }, 'invalid_city'],
  ])('%j is rejected with %s, without echoing values', (raw, code) => {
    let error: unknown;
    try {
      parseConfig({ ...base, ...raw });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ConfigError);
    expect((error as ConfigError).code).toBe(code);
    expect((error as ConfigError).message).not.toContain('sb_secret_');
  });

  test('localhost is only allowed when enabled (development)', () => {
    const local = { source: 'supabase', supabaseUrl: 'http://127.0.0.1:54321', publishableKey: PUBLISHABLE };
    expect(() => parseConfig({ ...local, allowLocalhost: false })).toThrow(ConfigError);
    expect(parseConfig({ ...local, allowLocalhost: true }).source).toBe('supabase');
  });
});

describe('links (REQ-012, 018, 053; S17, S34)', () => {
  test('only https URLs become links; markup stays text', () => {
    const segments = linkify('Hi <script>alert(1)</script> javascript:alert(1) http://x.com see https://example.com.');
    expect(segments.filter((s) => s.kind === 'link').map((s) => s.value)).toEqual(['https://example.com']);
    expect(segments.map((s) => s.value).join('')).toContain('<script>alert(1)</script>');
  });

  test('maps and registration allowlists', () => {
    expect(isAllowedMapsUrl('https://maps.app.goo.gl/abc')).toBe(true);
    expect(isAllowedMapsUrl('https://evil.example/map')).toBe(false);
    expect(isAllowedRegistrationUrl('https://forms.gle/abc123')).toBe(true);
    expect(isAllowedRegistrationUrl('https://docs.google.com/forms/d/e/x/viewform')).toBe(true);
    expect(isAllowedRegistrationUrl('https://evil.example/form')).toBe(false);
    expect(isAllowedRegistrationUrl('javascript:alert(1)')).toBe(false);
  });
});

const ROW = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'beach-social-001',
  status: 'published',
  title: 'Da Nang Beach Social #001',
  category: 'beach_outdoors',
  languages: ['en', 'vi', 'ru'],
  starts_at: '2026-12-05T10:00:00+00:00',
  ends_at: '2026-12-05T13:00:00+00:00',
  area: 'My Khe',
  venue_status: 'tbc',
  venue_name: null,
  price_type: 'free',
  price_vnd: null,
  solo_friendly: true,
  solo_details: 'A greeter meets newcomers at the entrance.',
  age_restriction: null,
  cover_image_url: 'https://vozitoaqntixingqwuiw.supabase.co/storage/v1/object/public/event-covers/b.jpg',
  material_changed_at: null,
  city: { slug: 'da-nang', name: 'Da Nang', time_zone: 'Asia/Ho_Chi_Minh' },
  description: 'The first MOVA beach social.',
  what_to_expect: null,
  venue_address: null,
  maps_url: 'https://maps.app.goo.gl/abc',
  payment_note: null,
  organizer_name: 'MOVA Team',
  accessibility_notes: null,
  cancellation_note: null,
  change_note: null,
  registration_url: 'https://forms.gle/abc123',
  updated_at: '2026-12-01T10:00:00+00:00',
};
const OPTIONS = { coverHost: 'vozitoaqntixingqwuiw.supabase.co' };

describe('row validation (REQ-030, 037)', () => {
  test('a valid row maps to an event', () => {
    const detail = toEventDetail(ROW, OPTIONS);
    expect(detail).toMatchObject({ slug: 'beach-social-001', soloFriendly: true, registrationUrl: 'https://forms.gle/abc123' });
    expect(detail?.startsAt.toISOString()).toBe('2026-12-05T10:00:00.000Z');
    expect(detail?.mapsUrl).toBeNull(); // maps only for confirmed venues
  });

  test.each([
    ['missing title', { title: null }],
    ['draft status', { status: 'draft' }],
    ['end before start', { ends_at: '2026-12-05T09:00:00+00:00' }],
    ['paid without price', { price_type: 'paid' }],
    ['missing city', { city: null }],
  ])('%s → excluded', (_label, patch) => {
    expect(toEventSummary({ ...ROW, ...patch }, OPTIONS)).toBeNull();
  });

  test('unknown category or language is kept with a safe fallback (amendment v0.5, REQ-037)', () => {
    const event = toEventSummary({ ...ROW, category: 'dating', languages: ['en', 'de'] }, OPTIONS);
    expect(event?.category).toBe('other');
    expect(event?.languages).toEqual(['en', 'other']);
  });

  test('empty category or language values are still excluded', () => {
    expect(toEventSummary({ ...ROW, category: '' }, OPTIONS)).toBeNull();
    expect(toEventSummary({ ...ROW, languages: [] }, OPTIONS)).toBeNull();
    expect(toEventSummary({ ...ROW, languages: [''] }, OPTIONS)).toBeNull();
  });

  test('URL allowlists reject traversal, encoded dots and backslashes (SEC-8)', () => {
    const base = { ...ROW, venue_status: 'confirmed', venue_name: 'Venue' };
    const bad = [
      'https://www.google.com/maps/../url?q=https://evil.example',
      'https://www.google.com/maps/%2e%2e/url',
      'https://www.google.com/maps/' + String.fromCharCode(92) + 'x',
    ];
    for (const maps_url of bad) {
      expect(toEventDetail({ ...base, maps_url }, OPTIONS)?.mapsUrl).toBeNull();
    }
    expect(toEventDetail({ ...base, registration_url: 'https://docs.google.com/forms/../document/d/x' }, OPTIONS)?.registrationUrl).toBeNull();
    expect(toEventDetail({ ...base, maps_url: 'https://www.google.com/maps/place/Da+Nang' }, OPTIONS)?.mapsUrl).toBe('https://www.google.com/maps/place/Da+Nang');
  });

  test('an invalid updated_at is null, not a made-up date (CR-12b)', () => {
    expect(toEventDetail({ ...ROW, updated_at: 'not a date' }, OPTIONS)?.updatedAt).toBeNull();
    expect(toEventDetail(ROW, OPTIONS)?.updatedAt?.toISOString()).toBe('2026-12-01T10:00:00.000Z');
  });

  test('Solo-friendly without details shows no badge (S16)', () => {
    expect(toEventSummary({ ...ROW, solo_details: null }, OPTIONS)?.soloFriendly).toBe(false);
  });

  test('covers from other hosts and disallowed registration links are dropped', () => {
    expect(toEventSummary({ ...ROW, cover_image_url: 'https://tracker.example/x.jpg' }, OPTIONS)?.coverImageUrl).toBeNull();
    expect(toEventDetail({ ...ROW, registration_url: 'https://evil.example/form' }, OPTIONS)?.registrationUrl).toBeNull();
  });
});

/** Minimal PostgREST builder double that records the query. */
function fakeClient(result: { data: unknown; error: unknown; status: number } | Error) {
  const calls: [string, unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'in', 'gt', 'order', 'limit', 'abortSignal']) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  const settle = () => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result));
  builder.maybeSingle = () => {
    calls.push(['maybeSingle', []]);
    return { then: (ok: (v: unknown) => unknown, ko: (e: unknown) => unknown) => settle().then(ok, ko) };
  };
  builder.then = (ok: (v: unknown) => unknown, ko: (e: unknown) => unknown) => settle().then(ok, ko);
  const client = { from: (table: string) => (calls.push(['from', [table]]), builder) };
  return { client: client as unknown as SupabaseClient<Database>, calls };
}

describe('Supabase repository (REQ-004, 017, 041, 051)', () => {
  test('lists with named columns, city filter and visible statuses only', async () => {
    const { client, calls } = fakeClient({ data: [ROW], error: null, status: 200 });
    const repo = createSupabaseRepository(client, OPTIONS);
    const events = await repo.listUpcoming('da-nang', new Date('2026-12-01T00:00:00Z'));
    expect(events.map((e) => e.slug)).toEqual(['beach-social-001']);
    expect(calls).toContainEqual(['select', [LIST_COLUMNS]]);
    expect(LIST_COLUMNS).not.toContain('*');
    expect(calls).toContainEqual(['eq', ['city.slug', 'da-nang']]);
    expect(calls).toContainEqual(['in', ['status', ['published', 'cancelled']]]);
    // CR-3: ended events are excluded in the query, ordered by start, and bounded.
    expect(calls).toContainEqual(['gt', ['ends_at', '2026-12-01T00:00:00.000Z']]);
    expect(calls).toContainEqual(['order', ['starts_at', { ascending: true }]]);
    expect(calls).toContainEqual(['order', ['slug', { ascending: true }]]);
    expect(calls).toContainEqual(['limit', [200]]);
  });

  test('HTTP 500 → server LoadError, no raw message (S18)', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'relation "events" exploded', code: 'XX000' }, status: 500 });
    const repo = createSupabaseRepository(client, OPTIONS);
    await expect(repo.listUpcoming('da-nang', new Date())).rejects.toMatchObject({ kind: 'server' });
  });

  test('rows without a title are dropped, the rest are listed (S18)', async () => {
    const { client } = fakeClient({ data: [{ ...ROW, title: '' }, ROW], error: null, status: 200 });
    const repo = createSupabaseRepository(client, OPTIONS);
    const events = await repo.listUpcoming('da-nang', new Date('2026-12-01T00:00:00Z'));
    expect(events).toHaveLength(1);
  });

  test('invalid slugs return null without a request (S11)', async () => {
    const { client, calls } = fakeClient({ data: null, error: null, status: 200 });
    const repo = createSupabaseRepository(client, OPTIONS);
    expect(await repo.getBySlug('../etc/passwd')).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test('unknown slug is not available; detail uses named columns', async () => {
    const { client, calls } = fakeClient({ data: null, error: null, status: 200 });
    const repo = createSupabaseRepository(client, OPTIONS);
    expect(await repo.getBySlug('does-not-exist')).toBeNull();
    expect(calls).toContainEqual(['select', [DETAIL_COLUMNS]]);
  });

  test.each([
    [{ data: null, error: { message: 'TypeError: fetch failed' }, status: 0 }, 'offline'],
    [{ data: null, error: { message: 'internal error', code: 'XX000' }, status: 500 }, 'server'],
    [new Error('Network request failed'), 'offline'],
  ])('failures are classified (%#)', async (result, kind) => {
    const { client } = fakeClient(result);
    const repo = createSupabaseRepository(client, OPTIONS);
    await expect(repo.listUpcoming('da-nang', new Date())).rejects.toEqual(new LoadError(kind as 'offline' | 'server'));
  });

  test('an aborted request is a timeout', async () => {
    const controller = new AbortController();
    controller.abort();
    const { client } = fakeClient({ data: null, error: { message: 'AbortError' }, status: 0 });
    const repo = createSupabaseRepository(client, OPTIONS);
    await expect(repo.listUpcoming('da-nang', new Date(), controller.signal)).rejects.toMatchObject({ kind: 'timeout' });
  });
});

describe('sample source (REQ-009, S21)', () => {
  test('sample events are labelled and never registrable', async () => {
    const repo = createSampleRepository();
    const events = await repo.listUpcoming('da-nang', new Date());
    expect(events.length).toBeGreaterThan(3);
    expect(events.every((e) => e.isSample)).toBe(true);
    const beach = await repo.getBySlug('beach-social-001');
    expect(beach?.registrationUrl).toBeNull();
    expect(await repo.listUpcoming('hanoi', new Date())).toEqual([]);
  });
});

describe('dark theme contrast (REQ-049, S30)', () => {
  test.each(TEXT_PAIRS.map(([fg, bg]) => [fg, bg]))('%s on %s ≥ 4.5:1', (fg, bg) => {
    expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
