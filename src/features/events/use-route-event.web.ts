// Web: the server loader renders the event into the first HTML response (REQ-010).
import { useLoaderData } from 'expo-router';

import { toInitialEvent, type EventRouteData, type InitialEvent } from './route-data';

export function useRouteEvent(): InitialEvent | null {
  const data = useLoaderData<() => Promise<EventRouteData>>() as EventRouteData | null | undefined;
  return toInitialEvent(data);
}
