/**
 * Discover on web: the query string is the source of truth for the filters
 * (Spec 002 REQ-028 C). The URL's filters are applied on first render, a
 * filter change writes the query string, and params a deep link leaves on
 * Discover (Expo Router's anchor) are cleared.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { DiscoverScreen } from '../../src/features/events/screens/DiscoverScreen';
import { resetEventCaches } from '../../src/features/events/use-events';

// The module object Discover reads (jest.setup.js mocks expo-router).
const ExpoRouter = jest.requireMock<typeof import('expo-router')>('expo-router');
const setParams = jest.fn();
let params: Record<string, string | undefined> = {};

const ALL_CLEARED = { date: undefined, solo: undefined, lang: undefined, price: undefined, cat: undefined };

beforeEach(() => {
  resetEventCaches();
  setParams.mockClear();
  params = {};
  jest.replaceProperty(Platform, 'OS', 'web');
  jest.spyOn(ExpoRouter, 'useLocalSearchParams').mockImplementation(() => params as never);
  jest.spyOn(ExpoRouter, 'useNavigation').mockImplementation(() => ({ setParams }) as never);
});

afterEach(() => jest.restoreAllMocks());

describe('Discover filters in the URL (web)', () => {
  test("a link's filters apply on first render", async () => {
    params = { lang: 'ru', solo: '1' };
    await render(<DiscoverScreen />);
    expect(await screen.findByText('Da Nang Beach Social #001')).toBeTruthy(); // RU, solo-friendly
    expect(screen.queryByText('Street Food Walk: An Thuong')).toBeNull(); // EN only, not solo
    expect(screen.getByRole('button', { name: 'Language: RU' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Solo-friendly', checked: true })).toBeTruthy();
    expect(setParams).not.toHaveBeenCalled();
  });

  test('a filter change writes the query string', async () => {
    await render(<DiscoverScreen />);
    await screen.findByText('Da Nang Beach Social #001');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Solo-friendly' }));
    expect(setParams).toHaveBeenLastCalledWith({ ...ALL_CLEARED, solo: '1' });
  });

  test('Clear all clears every filter key', async () => {
    params = { solo: '1', price: 'free' };
    await render(<DiscoverScreen />);
    await screen.findByText('Da Nang Beach Social #001');
    await fireEvent.press(screen.getByRole('button', { name: 'Clear all' }));
    expect(setParams).toHaveBeenLastCalledWith(ALL_CLEARED);
  });

  test("a deep link's params are cleared from Discover, filter keys included", async () => {
    params = { slug: 'beach-social-001', date: 'today' };
    await render(<DiscoverScreen />);
    await waitFor(() => expect(setParams).toHaveBeenCalledWith({ slug: undefined, ...ALL_CLEARED }));
  });
});
