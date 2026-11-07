/**
 * Discover card — Spec 002 REQ-003, REQ-007. Three layouts of one card:
 * `spotlight` (the next event, photo-led), `row` (phone list, fast to scan)
 * and `tile` (grid on tablet and desktop). Every layout shows date and time,
 * title, venue and area, category, languages, price, cover and badges; the
 * accessible name carries all of them, badges included (review CR-1).
 */
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { ChevronRight } from '@/design/icons';
import { webTransition, type InteractionState } from '@/design/motion';
import { AppText, focusRing } from '@/design/primitives';
import { colors, radii, spacing, tabularNums } from '@/design/tokens';
import { t } from '@/i18n';

import { languageCodes, priceLabel, venueLine } from '../format';
import { deviceUsesCityTime, formatDay, formatTime, isHappeningNow } from '../time';
import type { EventSummary } from '../types';

import { EventBadges, eventBadges } from './EventBadges';
import { EventPoster, Scrim } from './EventPoster';

export type EventCardVariant = 'spotlight' | 'row' | 'tile';

function useCardText(event: EventSummary, now: Date, locale: string) {
  const timeZone = event.city.timeZone;
  const day = formatDay(event.startsAt, locale, timeZone);
  const time = formatTime(event.startsAt, locale, timeZone);
  const cityTime = deviceUsesCityTime(now, timeZone) ? '' : ` (${t('event.cityTime', { city: event.city.name })})`;
  const when = `${day} · ${time}${cityTime}`;
  const where = venueLine(event);
  const meta = `${priceLabel(event, locale)} · ${languageCodes(event)}`;
  const category = t(`category.${event.category}`);
  const badgeText = eventBadges(event, now)
    .map((badge) => badge.label)
    .join(', ');
  const label = `${event.title}. ${when}. ${where} · ${languageCodes(event)} · ${priceLabel(event, locale)}. ${category}${badgeText ? `. ${badgeText}` : ''}`;
  return { day, time, cityTime, when, where, meta, category, label };
}

/**
 * The pressable surface of a card. Expo Router's `Link asChild` merges props
 * through a Slot that flattens a `style` function to `{}`, so the style
 * function lives here, out of the Slot's reach. Link's href and press
 * handlers pass straight through.
 */
function CardSurface({ variant, ...rest }: PressableProps & { variant: EventCardVariant }) {
  return (
    <Pressable
      {...rest}
      style={({ pressed, hovered, focused }: InteractionState) => [
        styles.pressable,
        variant === 'row' ? styles.rowCard : styles.card,
        webTransition(['transform', 'border-color', 'background-color'], 180),
        hovered && styles.hovered,
        pressed && styles.pressed,
        focused && focusRing,
      ]}
    />
  );
}

export function EventCard({
  event,
  now,
  locale,
  variant = 'tile',
  aspect = 4 / 5,
}: {
  event: EventSummary;
  now: Date;
  locale: string;
  variant?: EventCardVariant;
  /** Spotlight photo aspect ratio: tall on phones, wide on desktop. The text can make it taller. */
  aspect?: number;
}) {
  const text = useCardText(event, now, locale);
  const live = event.status === 'published' && isHappeningNow(event, now);
  const cancelled = event.status === 'cancelled';
  const [width, setWidth] = useState(0);
  const spotlightMinHeight = width > 0 ? Math.min(width / aspect, 560) : 360;

  // A real link: on web an <a href>, so Cmd/middle-click open a tab and crawlers find event pages.
  return (
    <Link href={{ pathname: '/events/[slug]', params: { slug: event.slug } }} asChild>
      <CardSurface variant={variant} accessibilityRole="link" accessibilityLabel={text.label}>
        {({ hovered }: InteractionState) =>
          variant === 'spotlight' ? (
            <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
              <EventPoster
                event={event}
                weekday={text.day}
                zoomed={hovered}
                priority
                style={[styles.spotlightPhoto, { minHeight: spotlightMinHeight }]}>
                <View style={styles.spotlightTop}>
                  <View style={[styles.glassPill, live && styles.livePill]}>
                    {live ? <View style={styles.liveDot} /> : null}
                    <AppText variant="label" style={styles.onPhotoText}>
                      {live ? t('status.happeningNow') : t('discover.nextUp')}
                    </AppText>
                  </View>
                </View>
                <View style={styles.spotlightBody}>
                  {/* The scrim sits behind the words, so contrast holds whatever their height. */}
                  <Scrim style={styles.spotlightScrim} />
                  <AppText variant="eyebrow" style={styles.onPhotoText}>
                    {text.category}
                  </AppText>
                  <AppText variant="eventTitleLarge" style={[styles.onPhotoText, cancelled && styles.struck]} numberOfLines={3}>
                    {event.title}
                  </AppText>
                  <AppText variant="bodyStrong" style={[styles.onPhotoText, tabularNums]}>
                    {text.when}
                  </AppText>
                  <AppText style={styles.onPhotoText}>{text.where}</AppText>
                  <View style={styles.spotlightFooter}>
                    <View style={styles.flexShrink}>
                      <AppText variant="label" style={styles.onPhotoText}>
                        {text.meta}
                      </AppText>
                    </View>
                    <View style={[styles.arrow, webTransition(['transform'], 150), hovered && styles.arrowHover]}>
                      <ChevronRight size={16} color={colors.onAccent} />
                    </View>
                  </View>
                  <EventBadges event={event} now={now} onPhoto only={['cancelled', 'updated', 'solo', 'age', 'sample']} />
                </View>
              </EventPoster>
            </View>
          ) : variant === 'row' ? (
            <View style={styles.row}>
              <EventPoster event={event} weekday={text.day} zoomed={hovered} style={styles.rowPhoto} />
              <View style={styles.rowBody}>
                <View style={styles.timeLine}>
                  {live ? <View style={styles.liveDotSmall} /> : null}
                  <AppText variant="label" tone={live ? 'success' : 'accent'} style={[styles.flexShrink, tabularNums]}>
                    {live ? `${t('status.happeningNow')} · ${text.time}${text.cityTime}` : text.when}
                  </AppText>
                </View>
                <AppText variant="eventTitle" numberOfLines={2} style={cancelled && styles.struck}>
                  {event.title}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {text.where}
                </AppText>
                <AppText variant="caption" tone="secondary" style={tabularNums}>
                  {`${text.category} · ${text.meta}`}
                </AppText>
                <EventBadges event={event} now={now} only={['cancelled', 'updated', 'solo', 'age', 'sample']} />
              </View>
            </View>
          ) : (
            <View>
              <EventPoster event={event} weekday={text.day} zoomed={hovered} style={styles.tilePhoto}>
                <View style={styles.tileTop}>
                  <View style={[styles.glassPill, live && styles.livePill]}>
                    {live ? <View style={styles.liveDot} /> : null}
                    <AppText variant="label" style={[styles.onPhotoText, tabularNums]}>
                      {live ? t('status.happeningNow') : text.time}
                    </AppText>
                  </View>
                  <View style={styles.glassPill}>
                    <AppText variant="label" style={styles.onPhotoText}>
                      {text.category}
                    </AppText>
                  </View>
                </View>
              </EventPoster>
              <View style={styles.tileBody}>
                <AppText variant="label" tone="accent" style={tabularNums}>
                  {text.when}
                </AppText>
                <AppText variant="eventTitle" numberOfLines={2} style={cancelled && styles.struck}>
                  {event.title}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {text.where}
                </AppText>
                <AppText variant="caption" tone="secondary" style={tabularNums}>
                  {text.meta}
                </AppText>
                <EventBadges event={event} now={now} only={['cancelled', 'updated', 'solo', 'age', 'sample']} />
              </View>
            </View>
          )
        }
      </CardSurface>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radii.card,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rowCard: {
    paddingVertical: spacing.sm,
  },
  hovered: {
    transform: [{ translateY: -2 }],
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  onPhotoText: {
    color: colors.text,
  },
  flexShrink: {
    flexShrink: 1,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.glass,
  },
  livePill: {
    borderWidth: 1,
    borderColor: colors.success,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  // Spotlight
  spotlightPhoto: {
    width: '100%',
    justifyContent: 'space-between',
  },
  spotlightScrim: {
    top: -72,
  },
  spotlightTop: {
    flexDirection: 'row',
    padding: spacing.lg,
  },
  spotlightBody: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
    gap: spacing.sm,
  },
  spotlightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowHover: {
    transform: [{ translateX: 3 }],
  },
  // Row
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  rowPhoto: {
    width: 96,
    height: 112,
    borderRadius: radii.tile,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  timeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Tile
  tilePhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.md,
  },
  tileBody: {
    padding: spacing.lg,
    gap: 4,
  },
});
