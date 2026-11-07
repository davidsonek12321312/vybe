/**
 * Loading, empty, error and banner states — Spec 002 REQ-009, 032–036.
 * Users never see error codes or raw messages (REQ-037).
 */
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { SunMark } from '@/design/icons';
import { useReducedMotion } from '@/design/motion';
import { AppText, Button } from '@/design/primitives';
import { colors, radii, spacing } from '@/design/tokens';
import { t } from '@/i18n';

import type { LoadErrorKind } from '../types';

/** A slow breathing pulse; still under reduced motion. */
function usePulse() {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 0.55, duration: 900, useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, value]);
  return value;
}

/** Skeleton in the shape of the screen being loaded: a spotlight, then rows. */
export function SkeletonCards({ count = 3, variant = 'list' }: { count?: number; variant?: 'list' | 'detail' }) {
  const opacity = usePulse();
  return (
    <Animated.View accessibilityLabel={t('states.loading')} accessibilityRole="progressbar" style={[styles.skeletons, { opacity }]}>
      {variant === 'detail' ? (
        <>
          <View style={styles.skeletonHero} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonLine, { width: '30%' }]} />
            <View style={[styles.skeletonLine, styles.skeletonTitle, { width: '80%' }]} />
            <View style={[styles.skeletonLine, { width: '55%' }]} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.skeletonSpotlight} />
          {Array.from({ length: count }, (_, index) => (
            <View key={index} style={styles.skeletonRow}>
              <View style={styles.skeletonThumb} />
              <View style={styles.skeletonBody}>
                <View style={[styles.skeletonLine, { width: '35%' }]} />
                <View style={[styles.skeletonLine, styles.skeletonTitle, { width: '85%' }]} />
                <View style={[styles.skeletonLine, { width: '60%' }]} />
              </View>
            </View>
          ))}
        </>
      )}
    </Animated.View>
  );
}

export function StateMessage({
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <View style={styles.message}>
      <View style={styles.mark}>
        <SunMark size={56} />
      </View>
      <AppText variant="heading" style={styles.center} accessibilityRole="header">
        {title}
      </AppText>
      {body ? (
        <AppText tone="secondary" style={styles.center}>
          {body}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
        {secondaryLabel && onSecondary ? <Button label={secondaryLabel} variant="secondary" onPress={onSecondary} /> : null}
      </View>
    </View>
  );
}

export function errorCopy(kind: LoadErrorKind | null): { title: string; body: string } {
  switch (kind) {
    case 'offline':
      return { title: t('states.offlineTitle'), body: t('states.offlineBody') };
    case 'timeout':
      return { title: t('states.timeoutTitle'), body: t('states.timeoutBody') };
    case 'config':
      return { title: t('states.configTitle'), body: t('states.configBody') };
    default:
      return { title: t('states.serverTitle'), body: t('states.serverBody') };
  }
}

/** A one-line notice: a tag, then the text. `tag` defaults to none. */
export function Banner({ text, tone, tag }: { text: string; tone: 'warning' | 'neutral'; tag?: string }) {
  return (
    <View style={[styles.banner, tone === 'warning' ? styles.bannerWarning : styles.bannerNeutral]} accessibilityRole="alert">
      {tag ? (
        <View style={[styles.tag, tone === 'warning' ? styles.tagWarning : styles.tagNeutral]}>
          <AppText variant="eyebrow" style={{ color: colors.onAccent }}>
            {tag}
          </AppText>
        </View>
      ) : null}
      <AppText variant="caption" tone={tone === 'warning' ? 'primary' : 'secondary'} style={styles.bannerText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  skeletonSpotlight: {
    height: 360,
    borderRadius: radii.card,
    backgroundColor: colors.raised,
  },
  skeletonHero: {
    height: 320,
    marginHorizontal: -spacing.lg,
    backgroundColor: colors.raised,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  skeletonThumb: {
    width: 96,
    height: 112,
    borderRadius: radii.tile,
    backgroundColor: colors.raised,
  },
  skeletonBody: {
    flex: 1,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.raised,
  },
  skeletonTitle: {
    height: 18,
  },
  message: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  mark: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.tile,
    borderWidth: 1,
  },
  bannerWarning: {
    borderColor: '#5A4519',
    backgroundColor: colors.surface,
  },
  bannerNeutral: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  bannerText: {
    flex: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  tagWarning: {
    backgroundColor: colors.warning,
  },
  tagNeutral: {
    backgroundColor: colors.textSecondary,
  },
});
