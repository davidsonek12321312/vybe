/**
 * Review CR-1: the card's accessible name includes its badges (REQ-003, 005, 006, 009, 016, 029; NFR-002).
 */
import { render, screen } from '@testing-library/react-native';

import { EventCard } from '@/features/events/components/EventCard';
import type { EventSummary } from '@/features/events/types';

const NOW = new Date('2026-12-03T05:00:00Z');

const base: EventSummary = {
  id: 'e1',
  slug: 'e1',
  status: 'cancelled',
  title: 'Beach Social',
  city: { slug: 'da-nang', name: 'Da Nang', timeZone: 'Asia/Ho_Chi_Minh' },
  category: 'social',
  languages: ['en'],
  area: 'My Khe',
  venue: { status: 'tbc', name: null },
  price: { type: 'free' },
  soloFriendly: true,
  ageRestriction: 18,
  coverImageUrl: null,
  materialChangedAt: null,
  isSample: true,
  startsAt: new Date('2026-12-05T10:00:00Z'),
  endsAt: new Date('2026-12-05T13:00:00Z'),
};

describe('EventCard accessible name', () => {
  it('includes Cancelled, Solo, 18+ and Sample badges', async () => {
    await render(<EventCard event={base} now={NOW} locale="en" onPress={() => {}} />);
    const card = screen.getByRole('link');
    const name = String(card.props.accessibilityLabel);
    expect(name).toContain('Beach Social');
    expect(name).toMatch(/Cancelled/);
    expect(name).toMatch(/Solo/);
    expect(name).toMatch(/18\+/);
    expect(name).toMatch(/Sample/);
  });

  it('does not clamp the venue, language and price line (CR-6, NFR-002)', async () => {
    await render(<EventCard event={base} now={NOW} locale="en" onPress={() => {}} />);
    const meta = screen.getByText(/Free/);
    expect(meta.props.numberOfLines).toBeUndefined();
  });
});
