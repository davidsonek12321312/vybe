// Jest setup file — runs before each test module is loaded (setupFiles).
// Shared mocks for native-only Expo modules; screens are tested in isolation.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', regionCode: 'US' }],
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'UTC' }],
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false };
  const Stack = Object.assign(() => null, { Screen: () => null });
  return {
    // The native Link renders text; test-renderer rejects text outside <Text>.
    Link: ({ children, accessibilityLabel }) => React.createElement(Text, { accessibilityLabel }, children),
    Stack,
    useRouter: () => router,
    useNavigation: () => ({ setParams: jest.fn() }),
    useLocalSearchParams: () => ({}),
    useLoaderData: () => undefined,
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }) => React.createElement(View, { style }, children),
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Image: () => React.createElement(View, { testID: 'expo-image' }) };
});
