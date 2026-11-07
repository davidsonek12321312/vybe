/**
 * Event details — Spec 002 REQ-010–020, 029–031, 040, 053.
 * Phone and tablet: a full-bleed cover with the details on a sheet over it
 * and the actions in a bar at the bottom. Desktop: banners across the top,
 * then the cover and the story on the left and a sticky panel on the right
 * with the title, the facts and the actions.
 * The cover is decorative to assistive tech, and the desktop row is reversed
 * so the panel comes first in the DOM: the reading order is the REQ-011
 * order (status banner, title, date and time, venue, languages, price,
 * organiser, "Coming alone?", what to expect, description). On phones the
 * cover is drawn above the banner; see design-lab/DESIGN_REVIEW.md, section 5.
 */
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeft, PinIcon, ShareIcon } from '@/design/icons';
import { useLayoutMode } from '@/design/layout';
import { webTransition, type InteractionState } from '@/design/motion';
import { AppText, Badge, Button, IconButton, focusRing, headingProps } from '@/design/primitives';
import { colors, radii, spacing, tabularNums } from '@/design/tokens';
import { getActiveLocale, t } from '@/i18n';

import { EventBadges } from '../components/EventBadges';
import { EventPoster } from '../components/EventPoster';
import { SafeText } from '../components/SafeText';
import { Banner, SkeletonCards, StateMessage, errorCopy } from '../components/StateViews';
import { languageNames, priceLabel } from '../format';
import { openExternal } from '../open-external';
import { getAppContext, type AppContext } from '../repository';
import { sampleCoverFor } from '../sample-covers';
import { eventUrl, shareLink } from '../share';
import { deviceUsesCityTime, formatDay, formatLongDate, formatStamp, formatTime, hasEnded, zonedParts } from '../time';
import type { EventDetail, EventSummary } from '../types';
import { useEventDetail, useNow } from '../use-events';

type Shown = EventSummary & Partial<Omit<EventDetail, keyof EventSummary>>;

/** A fact row: a small tile on the left, the label and its lines on the right. */
function Fact({ tile, label, children }: { tile: ReactNode; label: string; children: ReactNode }) {
  return (
    <View style={styles.fact}>
      <View style={styles.factTile} aria-hidden>
        {tile}
      </View>
      <View style={styles.factBody}>
        <AppText variant="eyebrow" tone="secondary">
          {label}
        </AppText>
        {children}
      </View>
    </View>
  );
}

/**
 * A tiny calendar page: the weekday on a coral strip, the day under it. The
 * weekday, not the month: short month names run long in some locales
 * ("tháng 11" in Vietnamese) and the month is in the text beside the tile.
 */
function CalendarTile({ date, locale, timeZone }: { date: Date; locale: string; timeZone: string }) {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone }).format(date).replace('.', '');
  return (
    <View style={styles.calendar}>
      <View style={styles.calendarMonth}>
        <AppText variant="eyebrow" numberOfLines={1} style={styles.calendarMonthText}>
          {weekday}
        </AppText>
      </View>
      <AppText variant="heading" style={[styles.calendarDay, tabularNums]}>
        {zonedParts(date, timeZone).day}
      </AppText>
    </View>
  );
}

function GlyphTile({ glyph }: { glyph: string }) {
  return (
    <AppText variant="subheading" tone="accent">
      {glyph}
    </AppText>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading" {...headingProps(2)}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function EventDetailScreen({
  slug,
  initialEvent,
  initiallyNotAvailable = false,
  context = getAppContext(),
}: {
  slug: string;
  initialEvent?: EventDetail | null;
  initiallyNotAvailable?: boolean;
  context?: AppContext;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, width: windowWidth } = useLayoutMode();
  const wide = mode === 'wide';
  // Phone: a top bar with the title fades in as the cover scrolls away.
  const [scrollY] = useState(() => new Animated.Value(0));
  const heroHeight = Math.min(windowWidth * (mode === 'medium' ? 9 / 16 : 3 / 4), 460);
  const barOpacity = scrollY.interpolate({
    inputRange: [heroHeight - 140, heroHeight - 70],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const repository = context.ok ? context.repository : null;
  const siteUrl = context.ok ? context.config.siteUrl : null;
  const detail = useEventDetail(repository, slug, initialEvent, initiallyNotAvailable);
  const now = useNow();
  const locale = getActiveLocale();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const goToDiscover = () => router.replace('/');
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (detail.status === 'not_available') {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StateMessage
          title={t('states.notAvailableTitle')}
          body={t('states.notAvailableBody')}
          actionLabel={t('event.backToEvents')}
          onAction={goToDiscover}
        />
      </SafeAreaView>
    );
  }

  const event: Shown | null = detail.event ?? detail.summary;
  if (!event) {
    if (detail.status === 'error') {
      const copy = errorCopy(detail.errorKind);
      return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <StateMessage
            title={copy.title}
            body={copy.body}
            actionLabel={detail.errorKind === 'config' ? undefined : t('states.retry')}
            onAction={detail.retry}
            secondaryLabel={t('event.backToEvents')}
            onSecondary={goToDiscover}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <View style={[styles.topControls, { top: insets.top + spacing.sm }]}>
          <IconButton label={t('event.backToEvents')} onPress={goBack} onPhoto>
            <ChevronLeft size={18} />
          </IconButton>
        </View>
        {detail.slow ? <StateMessage title={t('states.slow')} actionLabel={t('states.retry')} onAction={detail.retry} /> : null}
        <SkeletonCards variant="detail" />
      </SafeAreaView>
    );
  }

  const timeZone = event.city.timeZone;
  const ended = hasEnded(event, now);
  const cityTime = deviceUsesCityTime(now, timeZone) ? '' : ` (${t('event.cityTime', { city: event.city.name })})`;
  const dateLine = formatLongDate(event.startsAt, locale, timeZone);
  const timeLine = `${formatTime(event.startsAt, locale, timeZone)}–${formatTime(event.endsAt, locale, timeZone)}${cityTime}`;
  const showUpdated = event.status === 'published' && !ended && event.materialChangedAt !== null && event.startsAt > now;
  const canRegister =
    !event.isSample && event.status === 'published' && !ended && typeof event.registrationUrl === 'string';
  const credit = sampleCoverFor(event)?.credit ?? null;

  const onShare = async () => {
    const result = await shareLink({
      url: eventUrl(event.slug, siteUrl),
      title: event.title,
      copiedMessage: t('event.linkCopied'),
    });
    setShareNote(result === 'copied' ? t('event.linkCopied') : result === 'failed' ? t('event.shareFailed') : null);
  };

  const banners = (
    <>
      {!detail.event ? (
        detail.status === 'error' ? (
          <View style={styles.partial}>
            <Banner text={errorCopy(detail.errorKind).title} tone="warning" />
            {detail.errorKind === 'config' ? null : <Button label={t('states.retry')} variant="secondary" onPress={detail.retry} />}
          </View>
        ) : (
          <View style={styles.partial}>
            <Banner text={detail.slow ? t('states.slow') : t('states.loading')} tone="neutral" />
            {detail.slow ? <Button label={t('states.retry')} variant="secondary" onPress={detail.retry} /> : null}
          </View>
        )
      ) : null}
      {event.status === 'cancelled' ? (
        <View style={[styles.banner, styles.bannerDanger]} accessibilityRole="alert">
          <Badge label={t('status.cancelled')} tone="danger" />
          {event.cancellationNote ? <AppText>{event.cancellationNote}</AppText> : null}
        </View>
      ) : null}
      {ended ? (
        <View style={[styles.banner, styles.bannerNeutral]} accessibilityRole="alert">
          <AppText variant="subheading">{t('status.ended')}</AppText>
        </View>
      ) : null}
      {showUpdated && event.materialChangedAt ? (
        <View style={[styles.banner, styles.bannerWarning]} accessibilityRole="alert">
          <AppText variant="label" tone="warning">
            {t('status.updatedAt', { when: formatStamp(event.materialChangedAt, locale, timeZone) })}
          </AppText>
          <AppText>{event.changeNote || t('status.detailsChanged')}</AppText>
        </View>
      ) : null}
    </>
  );

  const titleBlock = (
    <View style={styles.titleBlock}>
      <AppText variant="eyebrow" tone="accent">
        {t(`category.${event.category}`)}
      </AppText>
      <AppText variant="eventTitleLarge" {...headingProps(1)} style={event.status === 'cancelled' && styles.struck}>
        {event.title}
      </AppText>
      <EventBadges event={event} now={now} />
    </View>
  );

  const facts = (
    <View style={styles.facts}>
      <Fact tile={<CalendarTile date={event.startsAt} locale={locale} timeZone={timeZone} />} label={t('event.when')}>
        <AppText variant="bodyStrong">{dateLine}</AppText>
        <AppText tone="secondary" style={tabularNums}>
          {timeLine}
        </AppText>
      </Fact>
      <Fact tile={<PinIcon size={20} color={colors.accent} />} label={t('event.where')}>
        <AppText variant="bodyStrong">
          {event.venue.status === 'confirmed' && event.venue.name ? event.venue.name : t('event.venueToBeConfirmed')}
        </AppText>
        <AppText tone="secondary">{[event.venueAddress, event.area, event.city.name].filter(Boolean).join(' · ')}</AppText>
        {event.mapsUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t('event.openInMaps')}
            accessibilityHint={t('event.opensExternally')}
            onPress={() => openExternal(event.mapsUrl as string)}
            style={({ pressed, focused }: InteractionState) => [styles.inlineLink, pressed && styles.pressed, focused && focusRing]}>
            <AppText variant="label" tone="accent">
              {`${t('event.openInMaps')} ↗`}
            </AppText>
          </Pressable>
        ) : null}
      </Fact>
      <Fact tile={<GlyphTile glyph="Aa" />} label={t('event.languages')}>
        <AppText variant="bodyStrong">{languageNames(event)}</AppText>
      </Fact>
      <Fact tile={<GlyphTile glyph="₫" />} label={t('event.price')}>
        <AppText variant="bodyStrong" style={tabularNums}>
          {priceLabel(event, locale)}
        </AppText>
        {event.paymentNote ? <AppText tone="secondary">{event.paymentNote}</AppText> : null}
      </Fact>
      {event.organizerName ? (
        <View style={styles.host}>
          <View style={styles.avatar} aria-hidden>
            <AppText variant="label" tone="onAccent">
              {event.organizerName.slice(0, 1).toUpperCase()}
            </AppText>
          </View>
          <AppText variant="label" tone="secondary">
            {t('event.organizer', { name: event.organizerName })}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const story = (
    <View style={styles.story}>
      {event.soloFriendly && event.soloDetails ? (
        <View style={styles.solo}>
          <Badge label={t('badge.solo')} tone="sea" />
          <AppText variant="heading" {...headingProps(2)}>
            {t('solo.title')}
          </AppText>
          <AppText>{event.soloDetails}</AppText>
        </View>
      ) : null}
      {event.whatToExpect ? (
        <Section title={t('event.whatToExpect')}>
          <SafeText>{event.whatToExpect}</SafeText>
        </Section>
      ) : null}
      {event.description ? (
        <Section title={t('event.about')}>
          <SafeText>{event.description}</SafeText>
        </Section>
      ) : null}
      {event.ageRestriction ? <AppText tone="warning">{t('event.ageRestriction', { age: event.ageRestriction })}</AppText> : null}
      {event.accessibilityNotes ? (
        <Section title={t('event.accessibility')}>
          <AppText tone="secondary">{event.accessibilityNotes}</AppText>
        </Section>
      ) : null}
      <View style={styles.footnotes}>
        {event.updatedAt ? (
          <AppText variant="caption" tone="secondary">
            {t('event.lastUpdated', { date: formatStamp(event.updatedAt, locale, timeZone) })}
          </AppText>
        ) : null}
        {credit ? (
          <AppText variant="caption" tone="secondary">
            {t('event.photoCredit', { credit })}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  const actions = (
    <View style={styles.actionsBlock}>
      {shareNote ? (
        <AppText variant="caption" tone="secondary" accessibilityLiveRegion="polite" style={styles.center}>
          {shareNote}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={t('event.share')}
          variant={canRegister ? 'secondary' : 'primary'}
          icon={<ShareIcon size={18} color={canRegister ? colors.text : colors.onAccent} />}
          onPress={() => void onShare()}
        />
        {canRegister ? (
          <Button
            label={`${t('event.register')} ↗`}
            accessibilityRole="link"
            accessibilityHint={t('event.registerHint')}
            onPress={() => openExternal(event.registrationUrl as string)}
          />
        ) : null}
      </View>
      {canRegister ? (
        <AppText variant="caption" tone="secondary" style={styles.center}>
          {t('event.registerHint')}
        </AppText>
      ) : null}
    </View>
  );

  const weekday = formatDay(event.startsAt, locale, timeZone);

  if (wide) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.wideScroll}>
          <View style={styles.wideColumn}>
            <BackLink onPress={goBack} />
            {banners}
            <View style={styles.wideRow}>
              <View style={[styles.widePanel, stickyOnWeb]}>
                <View style={styles.panelCard}>
                  {titleBlock}
                  {facts}
                  {actions}
                </View>
              </View>
              <View style={styles.wideMain}>
                <EventPoster event={event} weekday={weekday} priority style={styles.widePhoto} />
                {story}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={[styles.topControls, { top: insets.top + spacing.sm }]}>
        <IconButton label={t('event.backToEvents')} onPress={goBack} onPhoto>
          <ChevronLeft size={18} />
        </IconButton>
      </View>
      {/* Decorative: the title is the page's h1 further down. */}
      <Animated.View
        pointerEvents="none"
        aria-hidden
        style={[styles.topBar, { paddingTop: insets.top, height: insets.top + 60, opacity: barOpacity }]}>
        <AppText variant="subheading" numberOfLines={1} style={styles.topBarTitle}>
          {event.title}
        </AppText>
      </Animated.View>
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: Platform.OS !== 'web',
        })}>
        <EventPoster event={event} weekday={weekday} priority style={[styles.hero, mode === 'medium' && styles.heroMedium]} />
        <View style={[styles.sheet, styles.column]}>
          {banners}
          {titleBlock}
          {facts}
          {story}
        </View>
      </Animated.ScrollView>
      <View style={styles.bottomBar}>
        <View style={styles.column}>{actions}</View>
      </View>
    </SafeAreaView>
  );
}

/** The desktop panel stays in view while the story scrolls (CSS sticky; web only). */
const stickyOnWeb = (Platform.OS === 'web' ? { position: 'sticky', top: spacing.lg } : null) as ViewStyle | null;

function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('event.backToEvents')}
      onPress={onPress}
      style={({ pressed, hovered, focused }: InteractionState) => [
        styles.backLink,
        webTransition(['background-color', 'border-color'], 150),
        hovered && styles.backLinkHover,
        pressed && styles.pressed,
        focused && focusRing,
      ]}>
      <ChevronLeft size={16} />
      <AppText variant="label">{t('event.backToEvents')}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  column: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  hero: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxHeight: 460,
  },
  heroMedium: {
    aspectRatio: 16 / 9,
  },
  sheet: {
    marginTop: -radii.sheet,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  topControls: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    paddingLeft: spacing.lg + 44 + spacing.md,
    paddingRight: spacing.lg,
  },
  banner: {
    borderRadius: radii.tile,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  bannerDanger: { borderColor: colors.danger },
  bannerWarning: { borderColor: colors.warning },
  bannerNeutral: { borderColor: colors.borderStrong },
  partial: {
    gap: spacing.sm,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  facts: {
    gap: spacing.lg,
  },
  fact: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  factTile: {
    width: 48,
    height: 48,
    borderRadius: radii.tile,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  factBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  calendar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  calendarMonth: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 1,
  },
  calendarMonthText: {
    color: colors.onAccent,
    fontSize: 10,
    lineHeight: 13,
  },
  calendarDay: {
    lineHeight: 30,
  },
  inlineLink: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
  host: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  story: {
    gap: spacing.xl,
  },
  solo: {
    borderRadius: radii.card,
    backgroundColor: colors.seaSoft,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  footnotes: {
    gap: spacing.xs,
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionsBlock: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  center: {
    textAlign: 'center',
  },
  // Desktop
  wideScroll: {
    paddingBottom: spacing.xxxl,
  },
  wideColumn: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginLeft: -spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  backLinkHover: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  wideRow: {
    // Reversed: the panel is first in the DOM (reading order) and drawn on the right.
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.xxl,
  },
  wideMain: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xl,
  },
  widePhoto: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: radii.card,
  },
  widePanel: {
    width: 400,
  },
  panelCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xl,
  },
});
