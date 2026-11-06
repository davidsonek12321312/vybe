/**
 * Fictional sample events for the `sample` data source (REQ-009). Dates are
 * relative to "now" in the city's time zone, so the list always looks current.
 * Every event is marked isSample and shows the sample label.
 */
import { zonedMidnight, zonedParts } from './time';
import type { City, EventDetail } from './types';

export const SAMPLE_CITY: City = { slug: 'da-nang', name: 'Da Nang', timeZone: 'Asia/Ho_Chi_Minh' };

export function buildSampleEvents(now: Date, city: City = SAMPLE_CITY): EventDetail[] {
  const p = zonedParts(now, city.timeZone);
  const at = (dayOffset: number, hour: number, minute = 0): Date =>
    new Date(zonedMidnight(p.year, p.month, p.day + dayOffset, city.timeZone).getTime() + (hour * 60 + minute) * 60000);
  const minutesFromNow = (minutes: number): Date =>
    new Date(Math.round((now.getTime() + minutes * 60000) / 300000) * 300000);
  const untilSaturday = (6 - p.weekday + 7) % 7;
  const saturday = untilSaturday === 0 && p.hour >= 20 ? 7 : untilSaturday;
  const sunday = saturday + 1;
  const friday = saturday === 0 ? 6 : saturday - 1;
  const yesterday = new Date(now.getTime() - 86400000);

  const base = {
    city,
    isSample: true,
    status: 'published' as const,
    coverImageUrl: null,
    materialChangedAt: null,
    ageRestriction: null,
    venueAddress: null,
    mapsUrl: null,
    paymentNote: null,
    accessibilityNotes: null,
    soloDetails: null,
    cancellationNote: null,
    changeNote: null,
    registrationUrl: null,
    whatToExpect: null,
    soloFriendly: false,
    organizerName: 'MOVA Team',
    updatedAt: yesterday,
  };

  return [
    {
      ...base,
      id: 'sample-coworking',
      slug: 'coworking-coffee-meetup',
      title: 'Co-working Coffee Meetup',
      category: 'social',
      languages: ['en', 'ru', 'vi'],
      startsAt: minutesFromNow(-45),
      endsAt: minutesFromNow(135),
      area: 'An Thuong',
      venue: { status: 'confirmed', name: 'Nomad Corner Café' },
      price: { type: 'free' },
      description: 'Bring your laptop, meet other remote workers and swap tips about life in the city.',
    },
    {
      ...base,
      id: 'sample-sunset',
      slug: 'sunset-social-my-khe',
      title: 'Sunset Social at My Khe',
      category: 'social',
      languages: ['en', 'vi'],
      startsAt: at(0, 18),
      endsAt: at(0, 21),
      area: 'My Khe',
      venue: { status: 'confirmed', name: 'My Khe Beach, lifeguard tower 3' },
      mapsUrl: 'https://maps.app.goo.gl/sample-my-khe',
      price: { type: 'free' },
      soloFriendly: true,
      soloDetails: 'Look for the violet MOVA flag by lifeguard tower 3. At 18:15 there is a short intro circle.',
      description: 'An easy evening on the beach to meet locals, travellers and nomads.',
      whatToExpect: 'Casual conversation, music and a short intro circle. Most people stay for an hour or two.',
    },
    {
      ...base,
      id: 'sample-volleyball',
      slug: 'morning-beach-volleyball',
      title: 'Morning Beach Volleyball',
      category: 'sports_fitness',
      languages: ['en', 'ru'],
      startsAt: at(1, 7),
      endsAt: at(1, 9),
      area: 'Pham Van Dong Beach',
      venue: { status: 'confirmed', name: 'Pham Van Dong Beach, court 2' },
      price: { type: 'free' },
      soloFriendly: true,
      soloDetails: 'Teams are mixed at the start, so you will not play alone.',
      description: 'Friendly games for all levels. Bring water and sunscreen.',
    },
    {
      ...base,
      id: 'sample-beach-social',
      slug: 'beach-social-001',
      title: 'Da Nang Beach Social #001',
      category: 'beach_outdoors',
      languages: ['en', 'vi', 'ru'],
      startsAt: at(saturday, 17),
      endsAt: at(saturday, 20),
      area: 'My Khe',
      venue: { status: 'tbc', name: null },
      price: { type: 'free' },
      soloFriendly: true,
      soloDetails: 'A greeter in a MOVA shirt meets newcomers at the entrance. At 17:15 there is a 10-minute intro circle.',
      description:
        'The first MOVA beach social. Meet new people at sunset with games and music. More details will follow at https://example.com/mova-beach-social.',
      whatToExpect: 'Icebreaker games, music and plenty of time to talk. Come alone or bring friends.',
      materialChangedAt: new Date(now.getTime() - 3 * 3600000),
      changeNote: 'Start time moved to 17:00.',
    },
    {
      ...base,
      id: 'sample-street-food',
      slug: 'street-food-walk-an-thuong',
      title: 'Street Food Walk: An Thuong',
      category: 'food_drink',
      languages: ['en'],
      startsAt: at(sunday, 18, 30),
      endsAt: at(sunday, 21, 30),
      area: 'An Thuong',
      venue: { status: 'confirmed', name: 'Meeting point: An Thuong 4 corner' },
      price: { type: 'paid', vnd: 250000 },
      paymentNote: 'Cash at the start; includes five tastings.',
      description: 'A guided walk through local favourites. Vegetarian options available.',
    },
    {
      ...base,
      id: 'sample-rooftop',
      slug: 'rooftop-night',
      title: 'Rooftop Night',
      status: 'cancelled',
      category: 'nightlife',
      languages: ['en'],
      startsAt: at(friday, 21),
      endsAt: at(friday + 1, 1),
      area: 'Son Tra',
      venue: { status: 'confirmed', name: 'Sky Deck' },
      price: { type: 'paid', vnd: 150000 },
      ageRestriction: 18,
      cancellationNote: 'The venue is closed for a private event.',
      description: 'Music and views over the river.',
    },
    {
      ...base,
      id: 'sample-sketching',
      slug: 'sketching-dragon-bridge',
      title: 'Sketching at the Dragon Bridge',
      category: 'arts_culture',
      languages: ['en', 'vi'],
      startsAt: at(4, 16),
      endsAt: at(4, 18),
      area: 'Hai Chau',
      venue: { status: 'confirmed', name: 'Dragon Bridge, east side' },
      price: { type: 'free' },
      description: 'Bring a sketchbook. All levels welcome.',
    },
    {
      ...base,
      id: 'sample-language',
      slug: 'vietnamese-english-exchange',
      title: 'Vietnamese–English Language Exchange',
      category: 'language_exchange',
      languages: ['vi', 'en'],
      startsAt: at(5, 19),
      endsAt: at(5, 21),
      area: 'Hai Chau',
      venue: { status: 'confirmed', name: 'The Workshop Coffee' },
      price: { type: 'paid', vnd: 50000 },
      paymentNote: 'Includes one drink.',
      soloFriendly: true,
      soloDetails: 'Hosts pair you with a conversation partner when you arrive.',
      description: 'Half the evening in Vietnamese, half in English. Beginners welcome.',
    },
    {
      ...base,
      id: 'sample-pottery',
      slug: 'intro-to-pottery',
      title: 'Intro to Pottery',
      category: 'workshops',
      languages: ['en', 'ru'],
      startsAt: at(6, 10),
      endsAt: at(6, 12, 30),
      area: 'Ngu Hanh Son',
      venue: { status: 'confirmed', name: 'Clay Studio' },
      price: { type: 'paid', vnd: 450000 },
      paymentNote: 'Includes materials and firing.',
      accessibilityNotes: 'Step-free entrance; seated workstations.',
      description: 'Learn the basics of hand-building and take your piece home after firing.',
    },
  ];
}
