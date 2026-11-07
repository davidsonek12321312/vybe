/**
 * Screen tests — Spec 001 REQ-002, REQ-003; Spec 002 S1, S11, S12, S16, S18,
 * S21, S24, S34. Native modules are mocked in jest.setup.js.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import NotFoundScreen from '../src/app/+not-found';
import type { AppContext } from '../src/features/events/repository';
import { buildSampleEvents } from '../src/features/events/sample-events';
import { DiscoverScreen } from '../src/features/events/screens/DiscoverScreen';
import { EventDetailScreen } from '../src/features/events/screens/EventDetailScreen';
import { LoadError, type EventDetail, type EventRepository } from '../src/features/events/types';
import { resetEventCaches } from '../src/features/events/use-events';
import { ConfigError } from '../src/config/env';

const LIVE_CONFIG = {
  source: 'supabase' as const,
  defaultCity: 'da-nang',
  siteUrl: 'https://mova.example',
  supabaseUrl: 'https://vozitoaqntixingqwuiw.supabase.co',
  publishableKey: 'sb_publishable_test_key_value',
};

function live(repository: EventRepository): AppContext {
  return { ok: true, config: LIVE_CONFIG, repository };
}

function liveEvent(patch: Partial<EventDetail> = {}): EventDetail {
  const sample = buildSampleEvents(new Date()).find((e) => e.slug === 'beach-social-001') as EventDetail;
  return { ...sample, isSample: false, registrationUrl: 'https://forms.gle/abc123', ...patch };
}

beforeEach(() => resetEventCaches());

describe('Discover (Spec 002)', () => {
  test('lists sample events with the sample label and banner (S1, S21)', async () => {
    await render(<DiscoverScreen />);
    expect(await screen.findByText('Da Nang Beach Social #001')).toBeTruthy();
    expect(screen.getByText('Preview: these are sample events, not real ones.')).toBeTruthy();
    expect(screen.getAllByText('Sample event, not real').length).toBeGreaterThan(0);
    expect(screen.getByText("What's on in Da Nang")).toBeTruthy();
  });

  test('the Solo-friendly chip keeps only solo-friendly events (REQ-026)', async () => {
    await render(<DiscoverScreen />);
    expect(await screen.findByText('Street Food Walk: An Thuong')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Solo-friendly' }));
    expect(screen.queryByText('Street Food Walk: An Thuong')).toBeNull();
    expect(screen.getByText('Da Nang Beach Social #001')).toBeTruthy();
  });

  test('offline error with Retry, no raw error text (S18)', async () => {
    const repository: EventRepository = {
      listUpcoming: () => Promise.reject(new LoadError('offline')),
      getBySlug: () => Promise.resolve(null),
    };
    await render(<DiscoverScreen context={live(repository)} />);
    expect(await screen.findByText("You're offline")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.queryByText(/LoadError|undefined|null/)).toBeNull();
  });

  test('no events → no-events message, no sample events (REQ-033)', async () => {
    const repository: EventRepository = { listUpcoming: () => Promise.resolve([]), getBySlug: () => Promise.resolve(null) };
    await render(<DiscoverScreen context={live(repository)} />);
    expect(await screen.findByText('No upcoming events yet')).toBeTruthy();
    expect(screen.queryByText('Sample event, not real')).toBeNull();
  });

  test('invalid configuration → Service unavailable, no sample fallback (S24)', async () => {
    await render(<DiscoverScreen context={{ ok: false, error: new ConfigError('missing_url') }} />);
    expect(await screen.findByText('Service unavailable')).toBeTruthy();
    expect(screen.queryByText('Da Nang Beach Social #001')).toBeNull();
  });
});

describe('Event details (Spec 002)', () => {
  test('sample event: venue to be confirmed, solo section, no Register (S12, S16, S21)', async () => {
    const sample = buildSampleEvents(new Date()).find((e) => e.slug === 'beach-social-001') as EventDetail;
    await render(<EventDetailScreen slug="beach-social-001" initialEvent={sample} />);
    expect(screen.getByText('Venue to be confirmed')).toBeTruthy();
    expect(screen.getByText('Coming alone?')).toBeTruthy();
    expect(screen.queryByText('Register ↗')).toBeNull();
    expect(screen.queryByText('Open in Maps')).toBeNull();
  });

  test('published live event with a form shows Register (S34)', async () => {
    const event = liveEvent();
    await render(<EventDetailScreen slug={event.slug} initialEvent={event} context={live({ listUpcoming: async () => [], getBySlug: async () => event })} />);
    expect(screen.getByRole('link', { name: 'Register ↗' })).toBeTruthy();
    expect(screen.getByText('Opens a MOVA team form outside the app')).toBeTruthy();
  });

  test('cancelled event shows the banner and hides Register (S7, S34)', async () => {
    const event = liveEvent({ status: 'cancelled', cancellationNote: 'Storm warning' });
    await render(<EventDetailScreen slug={event.slug} initialEvent={event} context={live({ listUpcoming: async () => [], getBySlug: async () => event })} />);
    expect(screen.getAllByText('Cancelled').length).toBeGreaterThan(0);
    expect(screen.getByText('Storm warning')).toBeTruthy();
    expect(screen.queryByText('Register ↗')).toBeNull();
  });

  test('unknown slug → Event not available (S11)', async () => {
    const repository: EventRepository = { listUpcoming: async () => [], getBySlug: async () => null };
    await render(<EventDetailScreen slug="does-not-exist" context={live(repository)} />);
    expect(await screen.findByText('Event not available')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to events' })).toBeTruthy();
  });

  test('server already found nothing → not available without another request (S11, D22)', async () => {
    const getBySlug = jest.fn(async () => null);
    await render(
      <EventDetailScreen slug="does-not-exist" initiallyNotAvailable context={live({ listUpcoming: async () => [], getBySlug })} />,
    );
    expect(screen.getByText('Event not available')).toBeTruthy();
    expect(getBySlug).not.toHaveBeenCalled();
  });
});

describe('Event details with only a cached summary (review CR-2, REQ-032/035, S18)', () => {
  test('detail fetch fails → partial view stays, with an error banner and Retry', async () => {
    const event = liveEvent();
    const getBySlug = jest
      .fn<Promise<EventDetail | null>, [string]>()
      .mockRejectedValueOnce(new LoadError('offline'))
      .mockResolvedValue(event);
    const repository: EventRepository = { listUpcoming: async () => [event], getBySlug };
    const list = await render(<DiscoverScreen context={live(repository)} />);
    expect(await screen.findByText(event.title)).toBeTruthy();
    await list.unmount();

    await render(<EventDetailScreen slug={event.slug} context={live(repository)} />);
    expect(await screen.findByText("You're offline")).toBeTruthy();
    expect(screen.getAllByText(event.title).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByText("You're offline")).toBeNull());
    expect(getBySlug).toHaveBeenCalledTimes(2);
  });
});

describe('NotFoundScreen (Spec 001 REQ-003)', () => {
  test('renders the not-found title', async () => {
    await render(<NotFoundScreen />);
    expect(screen.getByText('Page not found')).toBeTruthy();
  });

  test('contains a "Go to home" link element', async () => {
    await render(<NotFoundScreen />);
    expect(screen.getByLabelText('Go to home')).toBeTruthy();
  });
});
