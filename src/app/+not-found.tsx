/**
 * Not-found fallback — Spec 001 REQ-003, REQ-007; Spec 002 REQ-047 (HTTP 404
 * on the server build). Localized, with an accessible 44 pt link home.
 */
import { Link } from 'expo-router';
import type { Metadata } from 'expo-server';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/design/primitives';
import { MIN_TOUCH, colors, radii, spacing, typography } from '@/design/tokens';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return { title: `${t('notFound.title')} · MOVA` };
}

export default function NotFoundScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <AppText variant="title" accessibilityRole="header" style={styles.center}>
          {t('notFound.title')}
        </AppText>
        <AppText tone="secondary" style={styles.center}>
          {t('notFound.body')}
        </AppText>
        <Link href="/" accessibilityLabel={t('notFound.goHome')} accessibilityRole="link" style={styles.homeLink}>
          {t('notFound.goHome')}
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  center: {
    textAlign: 'center',
  },
  homeLink: {
    ...typography.subheading,
    color: colors.onAccent,
    backgroundColor: colors.accent,
    borderRadius: radii.chip,
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
