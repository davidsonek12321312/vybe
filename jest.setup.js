// Jest setup file — runs before each test module is loaded (setupFiles)
// This ensures expo-localization is mocked before any module initialises it.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', regionCode: 'US' }],
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'UTC' }],
}));
