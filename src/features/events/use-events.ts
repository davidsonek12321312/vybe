/**
 * Client data hooks — Spec 002 REQ-008, 032, 035, 036, 039.
 * 10 s → "Still loading…"; 20 s → request aborted (timeout). The last good
 * list stays in memory for the session (no persistent storage).
 */
import { useCallback, useEffect, useState } from 'react';

import { LoadError, type EventDetail, type EventRepository, type EventSummary, type LoadErrorKind } from './types';

const SLOW_MS = 10_000;
const TIMEOUT_MS = 20_000;

const listCache = new Map<string, { events: EventSummary[]; at: Date }>();
const summaryCache = new Map<string, EventSummary>();

export function getCachedSummary(slug: string): EventSummary | null {
  return summaryCache.get(slug) ?? null;
}

/** For tests: forget the session cache. */
export function resetEventCaches(): void {
  listCache.clear();
  summaryCache.clear();
}

function kindOf(error: unknown): LoadErrorKind {
  return error instanceof LoadError ? error.kind : 'server';
}

export interface ListState {
  status: 'loading' | 'ready' | 'error';
  slow: boolean;
  refreshing: boolean;
  events: EventSummary[];
  errorKind: LoadErrorKind | null;
  lastUpdated: Date | null;
}

export function useUpcomingEvents(repository: EventRepository | null, citySlug: string) {
  const [state, setState] = useState<ListState>(() => {
    const cached = listCache.get(citySlug);
    if (cached) {
      return { status: 'ready', slow: false, refreshing: false, events: cached.events, errorKind: null, lastUpdated: cached.at };
    }
    return repository
      ? { status: 'loading', slow: false, refreshing: false, events: [], errorKind: null, lastUpdated: null }
      : { status: 'error', slow: false, refreshing: false, events: [], errorKind: 'config', lastUpdated: null };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!repository) return;
    const controller = new AbortController();
    let active = true;
    const slowTimer = setTimeout(() => {
      if (active) setState((s) => ({ ...s, slow: true }));
    }, SLOW_MS);
    const timeoutTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    repository
      .listUpcoming(citySlug, new Date(), controller.signal)
      .then(
        (events) => {
          if (!active) return;
          const at = new Date();
          listCache.set(citySlug, { events, at });
          for (const event of events) summaryCache.set(event.slug, event);
          setState({ status: 'ready', slow: false, refreshing: false, events, errorKind: null, lastUpdated: at });
        },
        (error: unknown) => {
          if (!active) return;
          const errorKind = kindOf(error);
          // REQ-036: keep showing the session's last good list with an offline banner.
          setState((s) =>
            s.events.length > 0
              ? { ...s, status: 'ready', slow: false, refreshing: false, errorKind }
              : { status: 'error', slow: false, refreshing: false, events: [], errorKind, lastUpdated: null },
          );
        },
      )
      .finally(() => {
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
      });

    return () => {
      active = false;
      controller.abort();
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
    };
  }, [repository, citySlug, attempt]);

  const refresh = useCallback(() => {
    setState((s) =>
      s.events.length > 0
        ? { ...s, refreshing: true, slow: false }
        : { ...s, status: 'loading', slow: false, errorKind: null },
    );
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, refresh };
}

export type DetailStatus = 'loading' | 'ready' | 'not_available' | 'error';

interface DetailState {
  status: DetailStatus;
  slow: boolean;
  event: EventDetail | null;
  errorKind: LoadErrorKind | null;
}

/**
 * `initial` is the server-rendered event; `initiallyNotAvailable` means the
 * server already found no visible event. Either way the first fetch is skipped.
 */
export function useEventDetail(
  repository: EventRepository | null,
  slug: string,
  initial?: EventDetail | null,
  initiallyNotAvailable = false,
) {
  const [state, setState] = useState<DetailState>(() => {
    if (initial) return { status: 'ready', slow: false, event: initial, errorKind: null };
    if (initiallyNotAvailable) return { status: 'not_available', slow: false, event: null, errorKind: null };
    if (!repository) return { status: 'error', slow: false, event: null, errorKind: 'config' };
    return { status: 'loading', slow: false, event: null, errorKind: null };
  });
  const [attempt, setAttempt] = useState(0);
  const skipFirstFetch = Boolean(initial) || initiallyNotAvailable;

  useEffect(() => {
    if (!repository || (skipFirstFetch && attempt === 0)) return;
    const controller = new AbortController();
    let active = true;
    const slowTimer = setTimeout(() => {
      if (active) setState((s) => ({ ...s, slow: true }));
    }, SLOW_MS);
    const timeoutTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    repository
      .getBySlug(slug, controller.signal)
      .then(
        (event) => {
          if (!active) return;
          setState(
            event
              ? { status: 'ready', slow: false, event, errorKind: null }
              : { status: 'not_available', slow: false, event: null, errorKind: null },
          );
        },
        (error: unknown) => {
          if (!active) return;
          setState((s) => ({ ...s, status: s.event ? 'ready' : 'error', slow: false, errorKind: kindOf(error) }));
        },
      )
      .finally(() => {
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
      });

    return () => {
      active = false;
      controller.abort();
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
    };
  }, [repository, slug, attempt, skipFirstFetch]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: s.event ? s.status : 'loading', slow: false, errorKind: null }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, summary: state.event ?? getCachedSummary(slug), retry };
}

/** Current time, refreshed every minute (Happening now, exclusions). */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
