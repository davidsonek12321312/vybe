/**
 * Navigation smoke tests — REQ-002, REQ-003
 *
 * Verifies that:
 * - HomeScreen renders without throwing
 * - NotFoundScreen renders without throwing
 * - NotFoundScreen contains a link to "/"
 *
 * Screen components are tested in isolation; Expo Router and native
 * dependencies are mocked.
 */

// expo-localization is mocked globally in jest.setup.js

jest.mock('expo-router', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    // The native Link renders text; test-renderer rejects text outside <Text>.
    Link: ({ children, accessibilityLabel }: { children?: React.ReactNode; accessibilityLabel?: string }) =>
      ReactActual.createElement(Text, { accessibilityLabel }, children),
    Stack: { Screen: () => null },
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  };
});

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: 'SafeAreaProvider',
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../src/app/index';
import NotFoundScreen from '../src/app/+not-found';

describe('HomeScreen', () => {
  test('renders without throwing (REQ-002)', async () => {
    await render(<HomeScreen />);
  });

  test('renders the app title', async () => {
    const { getByText } = await render(<HomeScreen />);
    expect(getByText('Welcome to MOVA')).toBeTruthy();
  });

  test('shows the coming-soon message and no event, RSVP or sample content (REQ-005)', async () => {
    const { getByText, queryByText } = await render(<HomeScreen />);
    expect(getByText('Events in Da Nang are coming soon.')).toBeTruthy();
    expect(queryByText(/rsvp|book|sample|attend/i)).toBeNull();
  });
});

describe('NotFoundScreen', () => {
  test('renders without throwing (REQ-003)', async () => {
    await render(<NotFoundScreen />);
  });

  test('renders the not-found title', async () => {
    const { getByText } = await render(<NotFoundScreen />);
    expect(getByText('Page not found')).toBeTruthy();
  });

  test('contains a "Go to home" link element (REQ-003)', async () => {
    const { getByLabelText } = await render(<NotFoundScreen />);
    // The Link renders with accessibilityLabel="Go to home" (from i18n key)
    expect(getByLabelText('Go to home')).toBeTruthy();
  });
});
