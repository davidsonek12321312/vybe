/**
 * In-memory repository over the fictional sample events (REQ-009). Never
 * mixed with live data: the factory picks exactly one source.
 */
import { isListable } from './filters';
import { buildSampleEvents } from './sample-events';
import { isValidSlug, type EventRepository } from './types';

export function createSampleRepository(): EventRepository {
  return {
    async listUpcoming(citySlug, now) {
      return buildSampleEvents(now)
        .filter((event) => event.city.slug === citySlug && isListable(event, now))
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    },
    async getBySlug(slug) {
      if (!isValidSlug(slug)) return null;
      return buildSampleEvents(new Date()).find((event) => event.slug === slug) ?? null;
    },
  };
}
