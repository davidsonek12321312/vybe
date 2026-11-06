/**
 * Discover — Spec 002 REQ-001–009, 021–028, 032–039, 049, 051.
 */
import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/design/primitives';
import { colors, spacing } from '@/design/tokens';
import { getActiveLocale, t } from '@/i18n';

import { EventCard } from '../components/EventCard';
import { FilterBar } from '../components/FilterBar';
import { Banner, SkeletonCards, StateMessage, errorCopy } from '../components/StateViews';
import { NO_FILTERS, applyFilters, groupByDay, isListable } from '../filters';
import { cityLabelFromSlug } from '../format';
import { getAppContext, type AppContext } from '../repository';
import { addZonedDays, formatDay, formatTime, zonedDayKey } from '../time';
import type { Filters } from '../types';
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

export function DiscoverScreen({ context = getAppContext() }: { context?: AppContext }) {
  const router = useRouter();
  const repository = context.ok ? context.repository : null;
  const citySlug = context.ok ? context.config.defaultCity : 'da-nang';
  const isSampleSource = context.ok && context.config.source === 'sample';
  const list = useUpcomingEvents(repository, citySlug);
  const now = useNow();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const locale = getActiveLocale();

  const city = list.events[0]?.city ?? null;
  const cityName = city?.name ?? cityLabelFromSlug(citySlug);
  const visible = useMemo(() => list.events.filter((event) => isListable(event, now)), [list.events, now]);
  const filtered = useMemo(
    () => (city ? applyFilters(visible, filters, now, city.timeZone) : []),
    [visible, filters, now, city],
  );
  const sections = useMemo(() => {
    if (!city) return [];
    const todayKey = zonedDayKey(now, city.timeZone);
    const tomorrowKey = zonedDayKey(addZonedDays(now, 1, city.timeZone), city.timeZone);
    return groupByDay(filtered, now, city.timeZone).map((section) => ({
      ...section,
      title:
        section.key === todayKey
          ? t('discover.today')
          : section.key === tomorrowKey
            ? t('discover.tomorrow')
            : formatDay(section.day, locale, city.timeZone),
    }));
  }, [filtered, now, city, locale]);

  const openEvent = (slug: string) => router.push({ pathname: '/events/[slug]', params: { slug } });

  let body: ReactNode = null;
  if (list.status === 'loading') {
    body = (
      <View>
        {list.slow ? (
          <StateMessage title={t('states.slow')} actionLabel={t('states.retry')} onAction={list.refresh} />
        ) : null}
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
    body = <StateMessage title={t('states.emptyTitle')} body={t('states.emptyBody')} actionLabel={t('discover.refresh')} onAction={list.refresh} />;
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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.column}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="label" tone="accent" style={styles.wordmark}>
              MOVA
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {t('discover.title')}
            </AppText>
            <AppText tone="secondary">{t('discover.subtitle', { city: cityName })}</AppText>
          </View>
          {Platform.OS === 'web' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('discover.refresh')}
              onPress={list.refresh}
              style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}>
              <AppText variant="label" tone="accent">
                {list.refreshing ? t('discover.refreshing') : t('discover.refresh')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
        {isSampleSource ? <Banner text={t('discover.sampleBanner')} tone="warning" /> : null}
        {offlineSince ? <Banner text={t('states.offlineBanner', { time: offlineSince })} tone="neutral" /> : null}
        <FilterBar filters={filters} onChange={setFilters} resultCount={filtered.length} />
        {body ?? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EventCard event={item} now={now} locale={locale} onPress={openEvent} />}
            renderSectionHeader={({ section }) => (
              <AppText variant="label" tone="secondary" style={styles.sectionHeader} accessibilityRole="header">
                {section.title.toUpperCase()}
              </AppText>
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.list}
            refreshControl={
              Platform.OS === 'web' ? undefined : (
                <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.accent} />
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerText: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  wordmark: {
    letterSpacing: 3,
  },
  refresh: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    letterSpacing: 1.2,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
