/**
 * Loading, empty, error and banner states — Spec 002 REQ-009, 032–036.
 * Users never see error codes or raw messages (REQ-037).
 */
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/design/primitives';
import { colors, radii, spacing } from '@/design/tokens';
import { t } from '@/i18n';

import type { LoadErrorKind } from '../types';

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <View accessibilityLabel={t('states.loading')} accessibilityRole="progressbar" style={styles.skeletons}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonPoster} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonLine, { width: '40%' }]} />
            <View style={[styles.skeletonLine, { width: '85%', height: 18 }]} />
            <View style={[styles.skeletonLine, { width: '65%' }]} />
          </View>
        </View>
      ))}
    </View>
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
      <View style={styles.mark} />
      <AppText variant="heading" style={styles.center} accessibilityRole="header">
        {title}
      </AppText>
      {body ? (
        <AppText tone="secondary" style={styles.center}>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <View style={styles.action}>
          <Button label={secondaryLabel} variant="secondary" onPress={onSecondary} />
        </View>
      ) : null}
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

export function Banner({ text, tone }: { text: string; tone: 'warning' | 'neutral' }) {
  return (
    <View style={[styles.banner, tone === 'warning' ? styles.bannerWarning : styles.bannerNeutral]} accessibilityRole="alert">
      <AppText variant="caption" tone={tone === 'warning' ? 'warning' : 'secondary'}>
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
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  skeletonPoster: {
    height: 148,
    backgroundColor: colors.raised,
  },
  skeletonBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.raised,
  },
  message: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.raised,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  center: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
  },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  bannerWarning: {
    borderColor: colors.warning,
    backgroundColor: colors.surface,
  },
  bannerNeutral: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
