/**
 * Organiser links open outside the app via openExternal (SEC-10, REQ-018):
 * on web a new tab with noopener, never the same-tab navigation of Linking.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import { SafeText } from '@/features/events/components/SafeText';
import * as openExternalModule from '@/features/events/open-external';

afterEach(() => jest.restoreAllMocks());

test('tapping an https link in organiser text calls openExternal', async () => {
  const spy = jest.spyOn(openExternalModule, 'openExternal').mockImplementation(() => {});
  await render(<SafeText>{'See https://example.com/menu for details'}</SafeText>);
  await fireEvent.press(screen.getByText('https://example.com/menu'));
  expect(spy).toHaveBeenCalledWith('https://example.com/menu');
});
