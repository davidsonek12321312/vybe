// Native builds have no server loader; the screen loads through the repository (D23).
import type { InitialEvent } from './route-data';

export function useRouteEvent(): InitialEvent | null {
  return null;
}
