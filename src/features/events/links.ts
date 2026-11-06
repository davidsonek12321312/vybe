/**
 * URL rules for event content — Spec 002 REQ-012, REQ-018, REQ-053.
 * Regular expressions only (no URL parser), so behaviour is identical on
 * native, web and the server.
 */
const MAPS_URL = /^https:\/\/(www\.google\.com\/maps\/|maps\.app\.goo\.gl\/|maps\.apple\.com\/)/;
const REGISTRATION_URL = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/;
const HTTPS_URL = /^https:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/;
const URL_IN_TEXT = /https:\/\/[^\s<>"'`]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

export function isHttpsUrl(value: unknown): value is string {
  return typeof value === 'string' && HTTPS_URL.test(value);
}

export function isAllowedMapsUrl(value: unknown): value is string {
  return isHttpsUrl(value) && MAPS_URL.test(value);
}

export function isAllowedRegistrationUrl(value: unknown): value is string {
  return isHttpsUrl(value) && REGISTRATION_URL.test(value);
}

/** Host of an https URL, lower-cased, or null. */
export function hostOf(value: string): string | null {
  const match = /^https?:\/\/([^/?#:]+)/i.exec(value);
  return match ? match[1].toLowerCase() : null;
}

export type TextSegment = { kind: 'text'; value: string } | { kind: 'link'; value: string };

/**
 * Splits plain text into text and https-link segments (REQ-018). Anything that
 * is not an https URL, including `javascript:` or `http:`, stays plain text.
 */
export function linkify(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const start = match.index ?? 0;
    const raw = match[0];
    const url = raw.replace(TRAILING_PUNCTUATION, '');
    if (start > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, start) });
    }
    segments.push({ kind: 'link', value: url });
    cursor = start + url.length;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }
  return segments;
}
