/**
 * Not-found screen — fallback for all unrecognised routes
 * REQ-003, REQ-007
 *
 * Renders a user-facing message and a link back to "/" for any path that
 * does not match a defined route. Must meet WCAG 2.1 AA accessibility.
 */
import { Link, Stack } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { t } from '@/i18n';
import { AppColors } from '@/theme';

export default function NotFoundScreen(): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = AppColors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header">
            {t('notFound.title')}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary }}>
            {t('notFound.body')}
          </ThemedText>
          {/*
           * Link back to home — REQ-003 (typed route), REQ-007 (accessibility)
           * minHeight/minWidth: 44 satisfies WCAG 2.1 AA touch-target size.
           * accessibilityLabel explicitly labels the action.
           */}
          <Link
            href="/"
            accessibilityLabel={t('notFound.goHome')}
            accessibilityRole="link"
            style={[styles.homeLink, { color: colors.linkText }]}>
            {t('notFound.goHome')}
          </Link>
        </SafeAreaView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    textAlign: 'center',
  },
  homeLink: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    minHeight: 44,
    minWidth: 44,
    textAlignVertical: 'center',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
