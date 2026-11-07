/**
 * Route "/events/[slug]" — Spec 002 REQ-010, 017, 020, 047, 048.
 * On web the server loader renders the event into the first HTML response,
 * generateMetadata adds per-event Open Graph tags. In the production server,
 * a direct request for an unknown, draft or archived slug gets HTTP 404 with
 * a localized page; in-app navigation and the dev server get loader data and
 * show the in-app "Event not available" state (D22).
 */
import { useLocalSearchParams } from 'expo-router';
import type { Metadata } from 'expo-server';

import { venueLine } from '@/features/events/format';
import { getAppContext } from '@/features/events/repository';
import {
  isDocumentRequest,
  loadEventForRoute,
  notAvailableResponse,
  toEventPayload,
  type EventRouteData,
} from '@/features/events/route-data';
import type { EventDetail } from '@/features/events/types';
import { EventDetailScreen } from '@/features/events/screens/EventDetailScreen';
import { formatLongDate, formatTime } from '@/features/events/time';
import { useRouteEvent } from '@/features/events/use-route-event';
import { t } from '@/i18n';

type RouteParams = Record<string, string | string[]>;

function slugFrom(params: RouteParams): string {
  const value = params.slug;
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export async function loader(request: Request | undefined, params: RouteParams): Promise<EventRouteData> {
  let event: EventDetail | null;
  try {
    event = await loadEventForRoute(slugFrom(params));
  } catch {
    // Data API unreachable or misconfigured: the screen retries in the browser.
    return { status: 'error' };
  }
  if (event) return { status: 'found', event: toEventPayload(event) };
  if (!__DEV__ && isDocumentRequest(request)) {
    throw notAvailableResponse({
      title: t('states.notAvailableTitle'),
      body: t('states.notAvailableBody'),
      back: t('event.backToEvents'),
    });
  }
  return { status: 'not_available' };
}

export async function generateMetadata(_request: unknown, params: RouteParams): Promise<Metadata> {
  let event: EventDetail | null;
  try {
    event = await loadEventForRoute(slugFrom(params));
  } catch {
    // Lookup failed (not "missing"): neutral metadata, so messengers do not cache
    // an "Event not available" preview for a real event (review CR-4, REQ-020).
    return { title: 'MOVA' };
  }
  if (!event) {
    return { title: `${t('states.notAvailableTitle')} · MOVA`, robots: { index: false } };
  }
  const zone = event.city.timeZone;
  const description = `${formatLongDate(event.startsAt, 'en', zone)} · ${formatTime(event.startsAt, 'en', zone)} · ${venueLine(event)} · ${event.city.name}`;
  const context = getAppContext();
  const siteUrl = context.ok ? context.config.siteUrl : null;
  return {
    title: t('meta.eventTitle', { title: event.title }),
    description,
    openGraph: {
      title: event.title,
      description,
      type: 'website',
      ...(event.coverImageUrl ? { images: [{ url: event.coverImageUrl }] } : {}),
      ...(siteUrl ? { url: `${siteUrl}/events/${event.slug}` } : {}),
    },
  };
}

export default function EventRoute(): React.JSX.Element {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const initial = useRouteEvent();
  return (
    <EventDetailScreen
      slug={typeof slug === 'string' ? slug : ''}
      initialEvent={initial?.status === 'found' ? initial.event : null}
      initiallyNotAvailable={initial?.status === 'not_available'}
    />
  );
}
