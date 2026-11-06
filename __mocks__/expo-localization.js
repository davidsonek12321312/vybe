// Manual mock for expo-localization — used in all Jest tests
module.exports = {
  getLocales: () => [{ languageCode: 'en', regionCode: 'US' }],
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'UTC' }],
};
