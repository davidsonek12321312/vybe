/**
 * Web loader for /events/[slug] — Spec 002 REQ-010, REQ-017, REQ-047, D22.
 * Uses the sample data source (no EXPO_PUBLIC_MOVA_DATA_SOURCE in tests).
 */
import { loader } from '../../src/app/events/[slug]';
import * as repositoryModule from '../../src/features/events/repository';
import { isDocumentRequest, toInitialEvent, type EventRouteData } from '../../src/features/events/route-data';

declare const global: { __DEV__: boolean };

const htmlRequest = () => new Request('https://mova.example/events/x', { headers: { Accept: 'text/html,*/*' } });
const loaderRequest = () => new Request('https://mova.example/events/x', { headers: { Accept: 'application/json' } });

afterEach(() => jest.restoreAllMocks());

describe('isDocumentRequest', () => {
  test('page requests and crawlers are documents; loader fetches are not', () => {
    expect(isDocumentRequest(htmlRequest())).toBe(true);
    expect(isDocumentRequest(new Request('https://mova.example/', { headers: { Accept: '*/*' } }))).toBe(true);
    expect(isDocumentRequest(loaderRequest())).toBe(false);
    expect(isDocumentRequest(undefined)).toBe(false);
  });
});

describe('loader', () => {
  test('visible event → found, with JSON-safe dates', async () => {
    const data = await loader(loaderRequest(), { slug: 'beach-social-001' });
    expect(data.status).toBe('found');
    const initial = toInitialEvent(data);
    expect(initial?.status === 'found' && initial.event.startsAt instanceof Date).toBe(true);
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });

  test('unknown slug during in-app navigation → not_available data, never a thrown 404', async () => {
    await expect(loader(loaderRequest(), { slug: 'does-not-exist' })).resolves.toEqual({ status: 'not_available' });
  });

  test('unknown slug in the dev server → not_available data (no 500)', async () => {
    await expect(loader(htmlRequest(), { slug: 'does-not-exist' })).resolves.toEqual({ status: 'not_available' });
  });

  test('unknown slug, direct page request, production server → 404 HTML page', async () => {
    const previous = global.__DEV__;
    global.__DEV__ = false;
    try {
      const thrown: unknown = await loader(htmlRequest(), { slug: 'does-not-exist-prod' }).catch((error: unknown) => error);
      expect(thrown).toBeInstanceOf(Response);
      const response = thrown as Response;
      expect(response.status).toBe(404);
      const html = await response.text();
      expect(html).toContain('Event not available');
      expect(html).toContain('noindex');
      expect(html).toContain('<html lang="en">'); // active locale (CR-13)
      expect(html).toContain('background:#0B0B10'); // design token, not a copy
    } finally {
      global.__DEV__ = previous;
    }
  });

  test('data source unreachable → error status, so the browser retries', async () => {
    jest.spyOn(repositoryModule, 'getAppContext').mockReturnValue({
      ok: false,
      error: new (jest.requireActual('../../src/config/env').ConfigError)('missing_key'),
    });
    const data: EventRouteData = await loader(htmlRequest(), { slug: 'some-other-slug' });
    expect(data).toEqual({ status: 'error' });
    expect(toInitialEvent(data)).toBeNull();
  });

  test('server lookup passes a timeout signal (CR-5, SEC-3)', async () => {
    const getBySlug = jest.fn((_slug: string, signal?: AbortSignal) => {
      void signal;
      return Promise.resolve(null);
    });
    jest.spyOn(repositoryModule, 'getAppContext').mockReturnValue({
      ok: true,
      config: { source: 'sample', defaultCity: 'da-nang', siteUrl: null },
      repository: { listUpcoming: jest.fn(), getBySlug },
    });
    await loader(loaderRequest(), { slug: 'timeout-signal-probe' });
    expect(getBySlug).toHaveBeenCalledTimes(1);
    expect(getBySlug.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
  });
});
