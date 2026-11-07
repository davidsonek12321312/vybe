/**
 * Discover — Spec 002 REQ-001–009, 021–028, 032–039, 049, 051.
 * Phone: one virtualised list; the filter bar sticks under the top (REQ-021).
 * Tablet: the same page, two-column tiles. Desktop: a fixed side panel with
 * the title and every filter, and the events in a three-column grid.
 * The soonest event leads as the spotlight and is not repeated below.
 * On web the filters are mirrored in the query string (REQ-028 C).
 */
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinIcon, SunMark } from '@/design/icons';
import { useLayoutMode, type LayoutMode } from '@/design/layout';
import { TabBar } from '@/design/TabBar';
import { webTransition, type InteractionState } from '@/design/motion';
import { AppText, focusRing, headingProps } from '@/design/primitives';
import { colors, radii, spacing } from '@/design/tokens';
import { getActiveLocale, t } from '@/i18n';

import { EventCard } from '../components/EventCard';
import { FilterBar, FilterPanel } from '../components/FilterBar';
import { Banner, SkeletonCards, StateMessage, errorCopy } from '../components/StateViews';
import { FILTER_PARAM_KEYS, filtersFromKey, filtersFromParams, filtersKey, filtersToParams, foreignParamKeys } from '../filter-params';
import { NO_FILTERS, applyFilters, groupByDay, isListable } from '../filters';
import { cityLabelFromSlug } from '../format';
import { getAppContext, type AppContext } from '../repository';
import { addZonedDays, formatDay, formatLongDate, formatTime, zonedDayKey } from '../time';
import type { EventSummary, Filters } from '../types';
import { useNow, useUpcomingEvents } from '../use-events';

function describeFilters(filters: Filters): string {
  const parts: string[] = [];
  if (filters.date !== 'any') parts.push(t(`filters.${filters.date}`));
  if (filters.soloOnly) parts.push(t('filters.solo'));
  if (filters.languages.length > 0) {
    parts.push(`${t('filters.language')}: ${filters.languages.map((l) => t(`language.${l}`)).join(', ')}`);
  }
  if (filters.price !== 'any') parts.push(t(`filters.${filters.price}`));
  if (filters.categories.length > 0) {
    parts.push(`${t('filters.category')}: ${filters.categories.map((c) => t(`category.${c}`)).join(', ')}`);
  }
  return parts.join(' · ');
}

const COLUMNS: Record<LayoutMode, number> = { compact: 1, medium: 2, wide: 3 };
const GAP = spacing.lg;
const SPOTLIGHT_ASPECT: Record<LayoutMode, number> = { compact: 4 / 5, medium: 16 / 9, wide: 21 / 9 };

function TopBar({ cityName, onRefresh, refreshing }: { cityName: string; onRefresh: () => void; refreshing: boolean }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.wordmark} accessibilityLabel="MOVA" accessible>
        <SunMark size={22} />
        <AppText variant="subheading" style={styles.wordmarkText}>
          MOVA
        </AppText>
      </View>
      <View style={styles.topActions}>
        <View style={styles.cityPill}>
          <PinIcon size={14} color={colors.accent} />
          <AppText variant="label">{cityName}</AppText>
        </View>
        {Platform.OS === 'web' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('discover.refresh')}
            onPress={onRefresh}
            style={({ pressed, hovered, focused }: InteractionState) => [
              styles.refresh,
              webTransition(['background-color', 'border-color'], 150),
              hovered && styles.refreshHover,
              pressed && styles.pressed,
              focused && focusRing,
            ]}>
            <AppText variant="label" tone="secondary">
              {refreshing ? t('discover.refreshing') : t('discover.refresh')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Intro({ cityName, today, wide }: { cityName: string; today: string; wide: boolean }) {
  return (
    <View style={styles.intro}>
      <View style={styles.eyebrowRow}>
        <AppText variant="eyebrow" tone="accent">
          {t('discover.title')}
        </AppText>
        <AppText variant="eyebrow" tone="secondary">
          {today}
        </AppText>
      </View>
      <AppText variant={wide ? 'display' : 'hero'} {...headingProps(1)}>
        {t('discover.subtitle', { city: cityName.replace(/ /g, ' ') })}
      </AppText>
      <AppText tone="secondary">{t('discover.lede')}</AppText>
    </View>
  );
}

function DayHeader({ title, highlight }: { title: string; highlight: boolean }) {
  return (
    <View style={styles.dayHeader}>
      {highlight ? <View style={styles.dayDot} /> : null}
      <AppText variant="eyebrow" tone={highlight ? 'accent' : 'primary'} {...headingProps(2)}>
        {title}
      </AppText>
      <View style={styles.dayRule} />
    </View>
  );
}

/** Rows of equal cells; the last row is padded so tiles keep their width. */
function Grid<T>({
  items,
  columns,
  keyOf,
  render,
}: {
  items: T[];
  columns: number;
  keyOf: (item: T) => string;
  render: (item: T) => ReactNode;
}) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) rows.push(items.slice(i, i + columns));
  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((item) => (
            <View key={keyOf(item)} style={styles.gridCell}>
              {render(item)}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, index) => (
            <View key={`pad-${index}`} style={styles.gridCell} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** One item of the phone list: the page is flattened so it can be virtualised. */
type Row =
  | { kind: 'head' }
  | { kind: 'filters' }
  | { kind: 'body' }
  | { kind: 'spotlight'; event: EventSummary }
  | { kind: 'day'; key: string; title: string; today: boolean }
  | { kind: 'event'; event: EventSummary; first: boolean }
  | { kind: 'credits' };

function rowKey(row: Row): string {
  if (row.kind === 'event' || row.kind === 'spotlight') return `${row.kind}:${row.event.id}`;
  if (row.kind === 'day') return `day:${row.key}`;
  return row.kind;
}

export function DiscoverScreen({ context = getAppContext() }: { context?: AppContext }) {
  const repository = context.ok ? context.repository : null;
  const citySlug = context.ok ? context.config.defaultCity : 'da-nang';
  const isSampleSource = context.ok && context.config.source === 'sample';
  const list = useUpcomingEvents(repository, citySlug);
  const now = useNow();
  // navigation.setParams changes Discover's own route; router.setParams would
  // change whichever route is focused (a deep-linked event above Discover).
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const onWeb = Platform.OS === 'web';
  // Native: filters live in state. Web: the query string is the single source
  // of truth, so the URL always describes what is on screen, also after the
  // browser's Back and Forward, and a filtered view can be shared (REQ-028 C).
  const [localFilters, setLocalFilters] = useState<Filters>(() => filtersFromParams(params));
  const urlKey = filtersKey(params);
  const urlFilters = useMemo(() => filtersFromKey(urlKey), [urlKey]);
  const filters = onWeb ? urlFilters : localFilters;
  const [flowWidth, setFlowWidth] = useState(0);

  const setFilters = (next: Filters) => {
    if (!onWeb) {
      setLocalFilters(next);
      return;
    }
    const foreign = Object.fromEntries(foreignParamKeys(params).map((key) => [key, undefined]));
    navigation.setParams({ ...foreign, ...filtersToParams(next) } as never);
  };

  // A deep-linked event leaves its params (`slug`, and any query it carried) on
  // Discover, which sits under it as Expo Router's anchor, so Back would land on
  // "/?slug=…". Those params were meant for the event: clear them all.
  const foreignKeys = foreignParamKeys(params).join(',');
  useEffect(() => {
    if (!onWeb || foreignKeys === '') return;
    const cleared = [...foreignKeys.split(','), ...FILTER_PARAM_KEYS];
    navigation.setParams(Object.fromEntries(cleared.map((key) => [key, undefined])) as never);
  }, [foreignKeys, navigation, onWeb]);
  const locale = getActiveLocale();
  const { mode } = useLayoutMode();
  const wide = mode === 'wide';

  const city = list.events[0]?.city ?? null;
  const cityName = city?.name ?? cityLabelFromSlug(citySlug);
  const visible = useMemo(() => list.events.filter((event) => isListable(event, now)), [list.events, now]);
  const filtered = useMemo(
    () => (city ? applyFilters(visible, filters, now, city.timeZone) : []),
    [visible, filters, now, city],
  );
  // The soonest event that is still on leads; a cancelled one never does.
  const spotlight: EventSummary | null = filtered.find((event) => event.status !== 'cancelled') ?? null;
  const sections = useMemo(() => {
    if (!city) return [];
    const todayKey = zonedDayKey(now, city.timeZone);
    const tomorrowKey = zonedDayKey(addZonedDays(now, 1, city.timeZone), city.timeZone);
    const rest = filtered.filter((event) => event.id !== spotlight?.id);
    return groupByDay(rest, now, city.timeZone).map((section) => ({
      ...section,
      today: section.key === todayKey,
      title:
        section.key === todayKey
          ? t('discover.today')
          : section.key === tomorrowKey
            ? t('discover.tomorrow')
            : formatDay(section.day, locale, city.timeZone),
    }));
  }, [filtered, spotlight, now, city, locale]);

  const today = formatLongDate(now, locale, city?.timeZone ?? 'Asia/Ho_Chi_Minh');

  let body: ReactNode = null;
  if (list.status === 'loading') {
    body = (
      <View>
        {list.slow ? <StateMessage title={t('states.slow')} actionLabel={t('states.retry')} onAction={list.refresh} /> : null}
        <SkeletonCards />
      </View>
    );
  } else if (list.status === 'error') {
    const copy = errorCopy(list.errorKind);
    body = (
      <StateMessage
        title={copy.title}
        body={copy.body}
        actionLabel={list.errorKind === 'config' ? undefined : t('states.retry')}
        onAction={list.refresh}
      />
    );
  } else if (visible.length === 0) {
    body = (
      <StateMessage title={t('states.emptyTitle')} body={t('states.emptyBody')} actionLabel={t('discover.refresh')} onAction={list.refresh} />
    );
  } else if (filtered.length === 0) {
    body = (
      <StateMessage
        title={t('states.noMatchesTitle')}
        body={describeFilters(filters)}
        actionLabel={t('states.clearFilters')}
        onAction={() => setFilters(NO_FILTERS)}
        secondaryLabel={filters.date !== 'any' ? t('states.tryAnyDate') : undefined}
        onSecondary={() => setFilters({ ...filters, date: 'any' })}
      />
    );
  }

  const offlineSince =
    list.status === 'ready' && list.errorKind && list.lastUpdated
      ? formatTime(list.lastUpdated, locale, city?.timeZone ?? 'UTC')
      : null;

  const notices = (
    <View style={styles.notices}>
      {isSampleSource ? <Banner text={t('discover.sampleBanner')} tone="warning" tag={t('discover.previewTag')} /> : null}
      {offlineSince ? <Banner text={t('states.offlineBanner', { time: offlineSince })} tone="neutral" /> : null}
    </View>
  );

  const columns = COLUMNS[mode];
  const cell = flowWidth > 0 ? Math.floor((flowWidth - GAP * (columns - 1)) / columns) : 0;
  const events = body ?? (
    <View style={styles.events}>
      {spotlight ? (
        <View key={spotlight.id} style={styles.spotlight}>
          <EventCard event={spotlight} now={now} locale={locale} variant="spotlight" aspect={SPOTLIGHT_ASPECT[mode]} />
        </View>
      ) : null}
      {columns === 1 ? (
        sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <DayHeader title={section.title} highlight={section.today} />
            <View>
              {section.data.map((event, index) => (
                <View key={event.id} style={index > 0 && styles.rowDivider}>
                  <EventCard event={event} now={now} locale={locale} variant="row" />
                </View>
              ))}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.flow} onLayout={(e) => setFlowWidth(e.nativeEvent.layout.width)}>
          {sections.map((section) => {
            // Days flow side by side: a day takes as many columns as it has events.
            const span = Math.min(section.data.length, columns);
            const width = cell > 0 ? span * cell + (span - 1) * GAP : '100%';
            return (
              <View key={section.key} style={[styles.flowSection, { width }]}>
                <DayHeader title={section.title} highlight={section.today} />
                <Grid
                  items={section.data}
                  columns={span}
                  keyOf={(event) => event.id}
                  render={(event) => <EventCard event={event} now={now} locale={locale} variant="tile" />}
                />
              </View>
            );
          })}
        </View>
      )}
      {isSampleSource ? (
        <AppText variant="caption" tone="secondary" style={styles.credits}>
          {t('discover.photoCredits')}
        </AppText>
      ) : null}
    </View>
  );

  const refreshControl =
    Platform.OS === 'web' ? undefined : (
      <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.accent} />
    );

  if (wide) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.split}>
          <ScrollView style={styles.sidebar} contentContainerStyle={styles.sidebarContent}>
            <TopBar cityName={cityName} onRefresh={list.refresh} refreshing={list.refreshing} />
            <Intro cityName={cityName} today={today} wide />
            {notices}
            <FilterPanel filters={filters} onChange={setFilters} resultCount={filtered.length} />
          </ScrollView>
          <ScrollView style={styles.main} contentContainerStyle={styles.mainContent} refreshControl={refreshControl}>
            {events}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  const head = (
    <View style={[styles.column, styles.head]}>
      <TopBar cityName={cityName} onRefresh={list.refresh} refreshing={list.refreshing} />
      <Intro cityName={cityName} today={today} wide={false} />
      {notices}
    </View>
  );
  const filterBar = (
    <View style={styles.stickyBar}>
      <View style={styles.column}>
        <FilterBar filters={filters} onChange={setFilters} resultCount={filtered.length} />
      </View>
    </View>
  );

  if (mode === 'compact') {
    // Phone: a virtualised list, so a city with hundreds of events stays fast (NFR-003).
    const rows: Row[] = [{ kind: 'head' }, { kind: 'filters' }];
    if (body) {
      rows.push({ kind: 'body' });
    } else {
      if (spotlight) rows.push({ kind: 'spotlight', event: spotlight });
      for (const section of sections) {
        rows.push({ kind: 'day', key: section.key, title: section.title, today: section.today });
        section.data.forEach((event, index) => rows.push({ kind: 'event', event, first: index === 0 }));
      }
      if (isSampleSource) rows.push({ kind: 'credits' });
    }
    const renderRow = ({ item }: { item: Row }) => {
      switch (item.kind) {
        case 'head':
          return head;
        case 'filters':
          return filterBar;
        case 'body':
          return <View style={styles.listBody}>{body}</View>;
        case 'spotlight':
          return (
            <View style={[styles.spotlight, styles.listSpotlight]}>
              <EventCard event={item.event} now={now} locale={locale} variant="spotlight" aspect={SPOTLIGHT_ASPECT.compact} />
            </View>
          );
        case 'day':
          return (
            <View style={[styles.section, styles.listDay]}>
              <DayHeader title={item.title} highlight={item.today} />
            </View>
          );
        case 'event':
          return (
            <View style={[styles.section, !item.first && styles.rowDivider, styles.listRow]}>
              <EventCard event={item.event} now={now} locale={locale} variant="row" />
            </View>
          );
        case 'credits':
          return (
            <AppText variant="caption" tone="secondary" style={[styles.credits, styles.listCredits]}>
              {t('discover.photoCredits')}
            </AppText>
          );
      }
    };
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <FlatList
          data={rows}
          keyExtractor={rowKey}
          renderItem={renderRow}
          stickyHeaderIndices={[1]}
          initialNumToRender={24}
          maxToRenderPerBatch={12}
          windowSize={7}
          refreshControl={refreshControl}
          contentContainerStyle={styles.page}
          style={styles.list}
        />
        <TabBar active="discover" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView stickyHeaderIndices={[1]} refreshControl={refreshControl} contentContainerStyle={styles.page}>
        {head}
        {filterBar}
        <View style={styles.column}>{events}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  page: {
    paddingBottom: spacing.xxxl,
  },
  column: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
  },
  head: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  stickyBar: {
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmarkText: {
    letterSpacing: 4,
    fontWeight: '900',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refresh: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  refreshHover: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  intro: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  eyebrowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
  },
  notices: {
    gap: spacing.sm,
  },
  events: {
    paddingTop: spacing.lg,
    gap: spacing.xxl,
  },
  spotlight: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  dayRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GAP,
    rowGap: spacing.xxl,
    marginHorizontal: spacing.lg,
  },
  flowSection: {
    gap: spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  grid: {
    gap: GAP,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GAP,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  credits: {
    paddingHorizontal: spacing.lg,
  },
  listBody: {
    paddingTop: spacing.lg,
  },
  listSpotlight: {
    paddingTop: spacing.lg,
  },
  listDay: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  listRow: {
    marginHorizontal: spacing.lg,
    paddingHorizontal: 0,
  },
  listCredits: {
    paddingTop: spacing.xxl,
  },
  // Desktop
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 380,
    flexGrow: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  sidebarContent: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  main: {
    flex: 1,
  },
  mainContent: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
