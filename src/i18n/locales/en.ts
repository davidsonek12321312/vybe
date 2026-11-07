/**
 * English (EN) locale — source of truth for translation keys (two levels:
 * section.key). VI and RU must provide every key; TypeScript enforces it
 * through LocaleShape. Interpolation uses %{name}.
 */
const en = {
  app: {
    name: 'MOVA',
    tagline: 'Open social, starting in Da Nang',
  },
  discover: {
    title: 'Discover',
    subtitle: "What's on in %{city}",
    count: 'Events: %{count}',
    today: 'Today',
    tomorrow: 'Tomorrow',
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    sampleBanner: 'Preview: these are sample events, not real ones.',
    nextUp: 'Next up',
    lede: 'Meet locals, travellers and nomads at events around the city. Free to browse, no account needed.',
    previewTag: 'Preview',
    photoCredits: 'Sample photos are stand-ins from Wikimedia Commons (CC licences).',
  },
  filters: {
    date: 'Date',
    any: 'Any date',
    today: 'Today',
    tomorrow: 'Tomorrow',
    weekend: 'This weekend',
    next7: 'Next 7 days',
    category: 'Category',
    language: 'Language',
    price: 'Price',
    priceAny: 'Any price',
    free: 'Free',
    paid: 'Paid',
    solo: 'Solo-friendly',
    clearAll: 'Clear all',
    apply: 'Apply',
    reset: 'Reset',
    close: 'Close',
    sheetHint: 'Choose one or more',
    soloOnly: 'Only solo-friendly events',
    active: 'Filters: %{count}',
  },
  category: {
    other: 'Other',
    social: 'Social & Meetups',
    beach_outdoors: 'Beach & Outdoors',
    sports_fitness: 'Sports & Fitness',
    food_drink: 'Food & Drink',
    language_exchange: 'Language Exchange',
    arts_culture: 'Arts & Culture',
    workshops: 'Workshops',
    nightlife: 'Nightlife (18+)',
  },
  language: {
    en: 'English',
    vi: 'Vietnamese',
    ru: 'Russian',
    other: 'Other',
  },
  event: {
    free: 'Free',
    venueTbc: 'Venue TBC',
    venueToBeConfirmed: 'Venue to be confirmed',
    cityTime: '%{city} time',
    organizer: 'By %{name}',
    languages: 'Languages',
    price: 'Price',
    whatToExpect: 'What to expect',
    about: 'About',
    accessibility: 'Accessibility',
    ageRestriction: '%{age}+ only',
    lastUpdated: 'Last updated %{date}',
    openInMaps: 'Open in Maps',
    share: 'Share',
    linkCopied: 'Link copied',
    shareFailed: 'Could not share this link',
    register: 'Register',
    registerHint: 'Opens a MOVA team form outside the app',
    backToEvents: 'Back to events',
    when: 'When',
    where: 'Where',
    opensExternally: 'Opens outside the app',
    photoCredit: 'Photo: %{credit}',
  },
  status: {
    cancelled: 'Cancelled',
    ended: 'Event has ended',
    updated: 'Updated',
    updatedAt: 'Updated %{when}',
    detailsChanged: 'Details changed',
    happeningNow: 'Happening now',
    sample: 'Sample event, not real',
  },
  badge: {
    solo: 'Solo-friendly',
    age: '%{age}+',
  },
  solo: {
    title: 'Coming alone?',
  },
  states: {
    loading: 'Loading events…',
    slow: 'Still loading…',
    retry: 'Retry',
    emptyTitle: 'No upcoming events yet',
    emptyBody: 'New events are added every week.',
    noMatchesTitle: 'No events match your filters',
    clearFilters: 'Clear filters',
    tryAnyDate: 'Try “Any date”',
    offlineTitle: "You're offline",
    offlineBody: 'Check your connection and try again.',
    serverTitle: "Can't load events right now",
    serverBody: 'Please try again in a moment.',
    timeoutTitle: 'This is taking too long',
    timeoutBody: 'The connection is slow. Please try again.',
    configTitle: 'Service unavailable',
    configBody: "MOVA can't connect right now. Please try again later.",
    offlineBanner: 'Offline · last updated %{time}',
    notAvailableTitle: 'Event not available',
    notAvailableBody: 'This event does not exist or is no longer public.',
  },
  tabs: {
    discover: 'Discover',
    events: 'Events',
    create: 'Create',
    people: 'People',
    chat: 'Chat',
    soon: 'coming soon',
  },
  meta: {
    siteTitle: 'MOVA — Discover events in %{city}',
    siteDescription: 'Find real events and meet people in %{city}. Free to browse, no account needed.',
    eventTitle: '%{title} · MOVA',
  },
  notFound: {
    title: 'Page not found',
    body: "This page doesn't exist.",
    goHome: 'Go to home',
  },
};

type Sections = typeof en;

/** Every locale must provide every key of every section. */
export type LocaleShape = { [S in keyof Sections]: { [K in keyof Sections[S]]: string } };

export type TranslationKeys = {
  [S in keyof Sections & string]: `${S}.${keyof Sections[S] & string}`;
}[keyof Sections & string];

export default en;
