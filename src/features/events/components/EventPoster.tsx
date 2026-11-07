/**
 * Cover image or a designed placeholder (REQ-003, REQ-038). Remote images come
 * only from the project's Storage host (mapping enforces it); sample events
 * use bundled stand-in photographs. A failed load falls back to the
 * placeholder without changing the layout: the frame's size is set by its
 * parent, never by the image.
 */
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SunMark } from '@/design/icons';
import { webTransition } from '@/design/motion';
import { AppText } from '@/design/primitives';
import { colors, spacing, tabularNums } from '@/design/tokens';
import { t } from '@/i18n';

import { sampleCoverFor } from '../sample-covers';
import { zonedParts } from '../time';
import type { EventSummary } from '../types';

const SCRIM = require('../../../../assets/images/scrim.png');

export function EventPoster({
  event,
  weekday,
  style,
  zoomed = false,
  priority = false,
  children,
}: {
  event: EventSummary;
  weekday: string;
  style?: StyleProp<ViewStyle>;
  /** Hover state of the card around it: the photo scales inside its frame. */
  zoomed?: boolean;
  priority?: boolean;
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const sample = sampleCoverFor(event);
  const remote = failed ? null : event.coverImageUrl;
  const source = remote ? { uri: remote } : failed ? null : (sample?.source ?? null);

  return (
    <View style={[styles.poster, style]}>
      <View style={StyleSheet.absoluteFill} aria-hidden>
        {source ? (
          <View style={[StyleSheet.absoluteFill, webTransition(['transform'], 600), zoomed && styles.zoomed]}>
            <Image
              source={source}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              priority={priority ? 'high' : 'normal'}
              onError={() => setFailed(true)}
            />
          </View>
        ) : (
          <Placeholder event={event} weekday={weekday} />
        )}
      </View>
      {children}
    </View>
  );
}

/**
 * A dark gradient that fills its parent: clear at the top, 92 % dark from 30 %
 * of its height down. Put it behind text laid on a photograph, reaching a
 * little above the text, so white text stays at AA even over a white photo.
 */
export function Scrim({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      pointerEvents="none"
      aria-hidden
      style={[StyleSheet.absoluteFill, style]}>
      <Image source={SCRIM} style={StyleSheet.absoluteFill} contentFit="fill" />
    </View>
  );
}

function Placeholder({ event, weekday }: { event: EventSummary; weekday: string }) {
  const day = zonedParts(event.startsAt, event.city.timeZone).day;
  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderMark}>
        <SunMark size={140} color={colors.border} sea={colors.raised} />
      </View>
      <AppText variant="eyebrow" tone="accent">
        {t(`category.${event.category}`)}
      </AppText>
      <View>
        <AppText variant="hero" style={tabularNums}>
          {String(day).padStart(2, '0')}
        </AppText>
        <AppText variant="label" tone="secondary">
          {weekday}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    backgroundColor: colors.raised,
    overflow: 'hidden',
  },
  zoomed: {
    transform: [{ scale: 1.03 }],
  },
  placeholder: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: colors.raised,
  },
  placeholderMark: {
    position: 'absolute',
    right: -20,
    bottom: 10,
  },
});
