/** Amendment v0.7 A17: five tabs, one selected, the four unbuilt ones disabled and named. */
import { render, screen } from '@testing-library/react-native';

import { TabBar } from '../../src/design/TabBar';

describe('TabBar', () => {
  test('Discover is selected and the four unbuilt tabs are disabled "coming soon"', async () => {
    await render(<TabBar active="discover" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(screen.getByRole('tab', { name: 'Discover', selected: true })).toBeTruthy();
    for (const name of ['Events', 'Create', 'People', 'Chat']) {
      expect(screen.getByRole('tab', { name: `${name}, coming soon`, disabled: true })).toBeTruthy();
    }
  });
});
