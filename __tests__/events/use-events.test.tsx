/**
 * Data hooks with fake timers — Spec 002 REQ-032, 035, 036 (S18); review CR-3.
 * 10 s → slow; 20 s → request aborted and classified as a timeout; a failed
 * refresh keeps the session's last good list.
 */
import { act, renderHook } from '@testing-library/react-native';

import { buildSampleEvents } from '@/features/events/sample-events';
import { LoadError, type EventDetail, type EventRepository } from '@/features/events/types';
import { resetEventCaches, useEventDetail, useUpcomingEvents } from '@/features/events/use-events';

const NOW = new Date('2026-12-03T05:00:00Z');
const sample = buildSampleEvents(NOW) as EventDetail[];

/** Never resolves; rejects with a timeout LoadError when the signal aborts (like the real repository). */
function hanging(): EventRepository {
  const wait = (signal?: AbortSignal) =>
    new Promise<never>((_resolve, reject) => {
      signal?.addEventListener('abort', () => reject(new LoadError('timeout')));
    });
  return { listUpcoming: (_c, _n, signal) => wait(signal), getBySlug: (_s, signal) => wait(signal) };
}

beforeEach(() => {
  resetEventCaches();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe('useUpcomingEvents', () => {
  test('slow at 10 s, timeout error at 20 s', async () => {
    const repository = hanging(); // stable identity: the hooks re-run their effect when it changes
    const { result } = await renderHook(() => useUpcomingEvents(repository, 'da-nang'));
    expect(result.current.status).toBe('loading');
    expect(result.current.slow).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.slow).toBe(true);
    expect(result.current.status).toBe('loading');

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.errorKind).toBe('timeout');
  });

  test('a failed refresh keeps the last good list (offline banner state)', async () => {
    let fail = false;
    const repository: EventRepository = {
      listUpcoming: () => (fail ? Promise.reject(new LoadError('offline')) : Promise.resolve(sample)),
      getBySlug: () => Promise.resolve(null),
    };
    const { result } = await renderHook(() => useUpcomingEvents(repository, 'da-nang'));
    await act(async () => {});
    expect(result.current.status).toBe('ready');
    expect(result.current.events.length).toBe(sample.length);

    fail = true;
    await act(async () => {
      result.current.refresh();
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.errorKind).toBe('offline');
    expect(result.current.events.length).toBe(sample.length);
  });
});

describe('useEventDetail', () => {
  test('slow at 10 s, timeout error at 20 s', async () => {
    const repository = hanging();
    const { result } = await renderHook(() => useEventDetail(repository, 'beach-social-001'));
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.slow).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.errorKind).toBe('timeout');
  });

  test('missing event → not_available', async () => {
    const repository: EventRepository = { listUpcoming: () => Promise.resolve([]), getBySlug: () => Promise.resolve(null) };
    const { result } = await renderHook(() => useEventDetail(repository, 'nope'));
    await act(async () => {});
    expect(result.current.status).toBe('not_available');
  });
});
