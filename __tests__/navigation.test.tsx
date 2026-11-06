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

// Mock expo-router — factory must not reference out-of-scope variables
jest.mock('expo-router', () => ({
  Link: 'Link',
  Stack: {
    Screen: 'Stack.Screen',
  },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

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
  test('renders without throwing (REQ-002)', () => {
    expect(() => render(<HomeScreen />)).not.toThrow();
  });

  test('renders the app title', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Welcome to Vybe')).toBeTruthy();
  });

  test('shows the coming-soon message and no event, RSVP or sample content (REQ-005)', () => {
    const { getByText, queryByText } = render(<HomeScreen />);
    expect(getByText('Events in Da Nang are coming soon.')).toBeTruthy();
    expect(queryByText(/rsvp|book|sample|attend/i)).toBeNull();
  });
});

describe('NotFoundScreen', () => {
  test('renders without throwing (REQ-003)', () => {
    expect(() => render(<NotFoundScreen />)).not.toThrow();
  });

  test('renders the not-found title', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText('Page not found')).toBeTruthy();
  });

  test('contains a "Go to home" link element (REQ-003)', () => {
    const { getByLabelText } = render(<NotFoundScreen />);
    // The Link renders with accessibilityLabel="Go to home" (from i18n key)
    expect(getByLabelText('Go to home')).toBeTruthy();
  });
});
