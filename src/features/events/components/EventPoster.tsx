/**
 * Cover image or a designed placeholder (REQ-003, REQ-038). Images come only
 * from the project's Storage host (mapping enforces it); a failed load falls
 * back to the placeholder without changing the layout.
 */
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/design/primitives';
import { colors, radii, spacing } from '@/design/tokens';
import { t } from '@/i18n';

import { zonedParts } from '../time';
import type { EventSummary } from '../types';

export function EventPoster({ event, height = 148, weekday }: { event: EventSummary; height?: number; weekday: string }) {
  const [failed, setFailed] = useState(false);
  const cover = failed ? null : event.coverImageUrl;
  const day = zonedParts(event.startsAt, event.city.timeZone).day;

  return (
    <View style={[styles.poster, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <View style={[styles.glow, styles.glowLarge]} />
          <View style={[styles.glow, styles.glowSmall]} />
          <View style={styles.placeholder}>
            <AppText variant="label" tone="accent">
              {t(`category.${event.category}`)}
            </AppText>
            <View style={styles.dateBlock}>
              <AppText variant="display">{String(day).padStart(2, '0')}</AppText>
              <AppText variant="label" tone="secondary">
                {weekday}
              </AppText>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    backgroundColor: colors.raised,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
  },
  glowLarge: {
    width: 220,
    height: 220,
    right: -70,
    top: -90,
    opacity: 0.16,
  },
  glowSmall: {
    width: 90,
    height: 90,
    right: 60,
    bottom: -40,
    opacity: 0.1,
  },
  placeholder: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  dateBlock: {
    alignItems: 'flex-start',
  },
});
