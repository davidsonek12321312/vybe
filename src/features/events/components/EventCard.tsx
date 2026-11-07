/**
 * Discover card — Spec 002 REQ-003, REQ-007. Date and time first, then the
 * title, then where · languages · price, then badges.
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/design/primitives';
import { spacing } from '@/design/tokens';
import { t } from '@/i18n';

import { languageCodes, priceLabel, venueLine } from '../format';
import { deviceUsesCityTime, formatDay, formatTime } from '../time';
import type { EventSummary } from '../types';

import { EventBadges, eventBadges } from './EventBadges';
import { EventPoster } from './EventPoster';

export function EventCard({
  event,
  now,
  locale,
  onPress,
}: {
  event: EventSummary;
  now: Date;
  locale: string;
  onPress: (slug: string) => void;
}) {
  const timeZone = event.city.timeZone;
  const day = formatDay(event.startsAt, locale, timeZone);
  const time = formatTime(event.startsAt, locale, timeZone);
  const cityTime = deviceUsesCityTime(now, timeZone) ? '' : ` (${t('event.cityTime', { city: event.city.name })})`;
  const when = `${day} · ${time}${cityTime}`;
  const meta = `${venueLine(event)} · ${languageCodes(event)} · ${priceLabel(event, locale)}`;
  const badgeText = eventBadges(event, now).map((badge) => badge.label).join(', ');

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${event.title}. ${when}. ${meta}${badgeText ? `. ${badgeText}` : ''}`}
      onPress={() => onPress(event.slug)}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <Card>
        <EventPoster event={event} weekday={day} />
        <View style={styles.body}>
          <AppText variant="label" tone="accent">
            {when}
          </AppText>
          <AppText variant="subheading" numberOfLines={2}>
            {event.title}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {meta}
          </AppText>
          <EventBadges event={event} now={now} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
