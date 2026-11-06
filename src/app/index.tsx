/**
 * Home screen — Route "/"
 * Spec 001 REQ-002, REQ-003, REQ-005, REQ-006, REQ-007 (requirements v0.3)
 *
 * Localized app shell. Per REQ-005 it shows no event listings (sample or
 * live), attendance counts, RSVP controls or booking links; only a localized
 * "coming soon" message.
 */
import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { t } from '@/i18n';
import { VybeColors } from '@/theme';

export default function HomeScreen(): React.JSX.Element {
  const scheme = useColorScheme();
  const colors = VybeColors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header">
            {t('home.title')}
          </ThemedText>
          <ThemedText
            style={[styles.tagline, { color: colors.textSecondary }]}>
            {t('home.tagline')}
          </ThemedText>
        </ThemedView>
        <ThemedText style={[styles.comingSoon, { color: colors.text }]}>
          {t('home.comingSoon')}
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
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
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    fontSize: 16,
  },
  comingSoon: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
