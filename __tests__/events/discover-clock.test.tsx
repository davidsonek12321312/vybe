/**
 * Discover must list every upcoming sample event at any moment of the week,
 * whatever the device time zone. The first CI run failed on Saturday evening
 * in Da Nang because the weekend events fell outside the first render window.
 */
import { render, screen } from '@testing-library/react-native';

import { buildSampleEvents } from '../../src/features/events/sample-events';
import { isListable } from '../../src/features/events/filters';
import { DiscoverScreen } from '../../src/features/events/screens/DiscoverScreen';
import { resetEventCaches } from '../../src/features/events/use-events';

// Instants chosen in Da Nang time (UTC+7): Saturday evening (the CI failure),
// Friday late night, a Sunday just before midnight and a Monday just after.
const INSTANTS = [
  ['Saturday 20:23 (CI failure)', '2026-11-07T13:23:00Z'],
  ['Friday 23:50', '2026-11-06T16:50:00Z'],
  ['Sunday 23:59', '2026-11-08T16:59:00Z'],
  ['Monday 00:01', '2026-11-08T17:01:00Z'],
  ['Wednesday 09:00', '2026-11-11T02:00:00Z'],
] as const;
const ZONES = ['UTC', 'Pacific/Auckland', 'America/Los_Angeles'] as const;

const originalTz = process.env.TZ;
afterEach(() => {
  jest.useRealTimers();
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

describe.each(ZONES)('device time zone %s', (zone) => {
  test.each(INSTANTS)('%s: every upcoming sample event is rendered', async (_label, iso) => {
    process.env.TZ = zone;
    jest.useFakeTimers({ now: new Date(iso), advanceTimers: true });
    resetEventCaches();
    const expected = buildSampleEvents(new Date()).filter((e) => isListable(e, new Date()));
    expect(expected.length).toBeGreaterThanOrEqual(7);
    await render(<DiscoverScreen />);
    for (const event of expected) {
      expect(await screen.findByText(event.title)).toBeTruthy();
    }
  });
});
