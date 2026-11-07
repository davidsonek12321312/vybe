/**
 * Discover on a phone (the virtualised list): every upcoming sample event is
 * listed exactly once (the spotlight is not repeated), the sample labels and
 * filter bar are there, and filters still apply (REQ-001, 003, 009, 021, 026).
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import { buildSampleEvents } from '../../src/features/events/sample-events';
import { isListable } from '../../src/features/events/filters';
import { DiscoverScreen } from '../../src/features/events/screens/DiscoverScreen';
import { resetEventCaches } from '../../src/features/events/use-events';

jest.mock('@/design/layout', () => ({
  ...jest.requireActual('@/design/layout'),
  useLayoutMode: () => ({ mode: 'compact', width: 390 }),
}));

beforeEach(() => resetEventCaches());

// The same instants and device zones as discover-clock.test.tsx (which covers
// the tablet layout): every upcoming event must be inside the list's first
// render window at any moment of the week.
const INSTANTS = [
  ['Saturday 20:23', '2026-11-07T13:23:00Z'],
  ['Friday 23:50', '2026-11-06T16:50:00Z'],
  ['Sunday 23:59', '2026-11-08T16:59:00Z'],
  ['Monday 00:01', '2026-11-08T17:01:00Z'],
  ['Wednesday 09:00', '2026-11-11T02:00:00Z'],
] as const;
const ZONES = ['UTC', 'Pacific/Auckland', 'America/Los_Angeles'] as const;
const originalTz = process.env.TZ;

describe.each(ZONES)('phone list, device time zone %s', (zone) => {
  afterEach(() => {
    jest.useRealTimers();
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  test.each(INSTANTS)('%s: every upcoming sample event is rendered once', async (_label, iso) => {
    process.env.TZ = zone;
    jest.useFakeTimers({ now: new Date(iso), advanceTimers: true });
    resetEventCaches();
    const expected = buildSampleEvents(new Date()).filter((e) => isListable(e, new Date()));
    await render(<DiscoverScreen />);
    for (const event of expected) {
      expect(await screen.findByText(event.title)).toBeTruthy();
    }
  });
});

describe('Discover on a phone', () => {
  test('lists every upcoming sample event once, with the sample labels', async () => {
    const expected = buildSampleEvents(new Date()).filter((event) => isListable(event, new Date()));
    await render(<DiscoverScreen />);
    for (const event of expected) {
      expect(await screen.findByText(event.title)).toBeTruthy(); // findByText fails on duplicates
    }
    expect(screen.getByText('Preview: these are sample events, not real ones.')).toBeTruthy();
    expect(screen.getAllByText('Sample event, not real').length).toBe(expected.length);
  });

  test('the Solo-friendly chip filters the list', async () => {
    await render(<DiscoverScreen />);
    expect(await screen.findByText('Street Food Walk: An Thuong')).toBeTruthy();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Solo-friendly' }));
    expect(screen.queryByText('Street Food Walk: An Thuong')).toBeNull();
    expect(screen.getByText('Da Nang Beach Social #001')).toBeTruthy();
  });
});
