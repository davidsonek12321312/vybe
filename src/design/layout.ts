/**
 * Responsive layout mode. The web page is server-rendered without a window
 * size, so the first client render matches the server ("compact") and the
 * real mode applies after hydration. Native renders the real mode at once.
 */
import { useSyncExternalStore } from 'react';
import { useWindowDimensions } from 'react-native';

import { breakpoints } from './tokens';

export type LayoutMode = 'compact' | 'medium' | 'wide';

export function modeForWidth(width: number): LayoutMode {
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.medium) return 'medium';
  return 'compact';
}

const noSubscribe = () => () => {};

/** False while React hydrates server HTML, true afterwards and on native. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

export function useLayoutMode(): { mode: LayoutMode; width: number } {
  const { width } = useWindowDimensions();
  const hydrated = useHydrated();
  if (!hydrated) return { mode: 'compact', width: 390 };
  return { mode: modeForWidth(width), width };
}
