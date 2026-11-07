/**
 * Text badges, never colour alone (REQ-003, REQ-005, REQ-006, REQ-009, REQ-016, REQ-029).
 */
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/design/primitives';
import { spacing } from '@/design/tokens';
import { t } from '@/i18n';

import { isHappeningNow } from '../time';
import type { EventSummary } from '../types';

type BadgeSpec = { key: string; label: string; tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' };

/** Badge list shared by the visible badges and the card's accessible name (review CR-1). */
export function eventBadges(event: EventSummary, now: Date): BadgeSpec[] {
  const badges: BadgeSpec[] = [];
  if (event.status === 'cancelled') badges.push({ key: 'cancelled', label: t('status.cancelled'), tone: 'danger' });
  if (event.status === 'published' && isHappeningNow(event, now)) {
    badges.push({ key: 'now', label: t('status.happeningNow'), tone: 'success' });
  }
  if (event.materialChangedAt && event.startsAt > now && event.status === 'published') {
    badges.push({ key: 'updated', label: t('status.updated'), tone: 'warning' });
  }
  if (event.soloFriendly) badges.push({ key: 'solo', label: t('badge.solo'), tone: 'accent' });
  if (event.ageRestriction) badges.push({ key: 'age', label: t('badge.age', { age: event.ageRestriction }), tone: 'neutral' });
  if (event.isSample) badges.push({ key: 'sample', label: t('status.sample'), tone: 'warning' });
  return badges;
}

export function EventBadges({ event, now }: { event: EventSummary; now: Date }) {
  const badges = eventBadges(event, now);
  if (badges.length === 0) return null;
  return (
    <View style={styles.row}>
      {badges.map((badge) => (
        <Badge key={badge.key} label={badge.label} tone={badge.tone} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
