/**
 * Server-side event lookup for the web loader and metadata (REQ-010, 020,
 * 048). A short cache lets loader() and generateMetadata() share one Data
 * API request per page render.
 */
import { getAppContext } from './repository';
import { LoadError, type EventDetail } from './types';

const TTL_MS = 5000;
const MAX_ENTRIES = 200;
/** Server lookups must finish inside the function's maxDuration (review CR-5, SEC-3). */
export const LOOKUP_TIMEOUT_MS = 8000;
const cache = new Map<string, { at: number; value: Promise<EventDetail | null> }>();

export function loadEventForRoute(slug: string): Promise<EventDetail | null> {
  const context = getAppContext();
  if (!context.ok) return Promise.reject(new LoadError('config'));

  const now = Date.now();
  const hit = cache.get(slug);
  if (hit && now - hit.at < TTL_MS) return hit.value;

  const value = context.repository.getBySlug(slug, AbortSignal.timeout(LOOKUP_TIMEOUT_MS));
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(slug, { at: now, value });
  value.catch(() => cache.delete(slug));
  return value;
}

/** JSON-safe event for loader data (dates as ISO strings). */
export type EventPayload = Omit<EventDetail, 'startsAt' | 'endsAt' | 'materialChangedAt' | 'updatedAt'> & {
  startsAt: string;
  endsAt: string;
  materialChangedAt: string | null;
  updatedAt: string;
};

/**
 * Loader result. "error" means the server could not reach the data; the
 * screen then retries through the repository in the browser.
 */
export type EventRouteData =
  | { status: 'found'; event: EventPayload }
  | { status: 'not_available' }
  | { status: 'error' };

/** What the screen knows before its first client request. */
export type InitialEvent = { status: 'found'; event: EventDetail } | { status: 'not_available' };

export function toInitialEvent(data: EventRouteData | null | undefined): InitialEvent | null {
  if (data?.status === 'found') return { status: 'found', event: fromEventPayload(data.event) };
  if (data?.status === 'not_available') return { status: 'not_available' };
  return null;
}

/**
 * A browser or link-preview crawler asking for the page itself, as opposed to
 * the router fetching loader data during in-app navigation (Accept: JSON).
 */
export function isDocumentRequest(request: { headers?: { get(name: string): string | null } } | undefined): boolean {
  if (!request?.headers) return false;
  const accept = request.headers.get('accept') ?? '';
  return !accept.includes('application/json');
}

export function toEventPayload(event: EventDetail): EventPayload {
  return {
    ...event,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    materialChangedAt: event.materialChangedAt ? event.materialChangedAt.toISOString() : null,
    updatedAt: event.updatedAt.toISOString(),
  };
}

export function fromEventPayload(payload: EventPayload): EventDetail {
  return {
    ...payload,
    startsAt: new Date(payload.startsAt),
    endsAt: new Date(payload.endsAt),
    materialChangedAt: payload.materialChangedAt ? new Date(payload.materialChangedAt) : null,
    updatedAt: new Date(payload.updatedAt),
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Localized "Event not available" page with HTTP 404 (REQ-017 on web, D22).
 * Only thrown for document requests in the production server: the dev
 * server turns a thrown Response into a 500, and the router's loader fetch
 * fails on any non-2xx status.
 */
export function notAvailableResponse(text: { title: string; body: string; back: string }): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(text.title)} · MOVA</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B0B10;color:#F5F5F7;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px}main{max-width:420px}h1{font-size:22px;margin:0 0 12px}p{color:#A8A8B3;margin:0 0 24px;line-height:1.5}a{display:inline-block;background:#9D8CFF;color:#0B0B10;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:12px}</style></head><body><main><h1>${escapeHtml(text.title)}</h1><p>${escapeHtml(text.body)}</p><a href="/">${escapeHtml(text.back)}</a></main></body></html>`;
  return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
