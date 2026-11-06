/**
 * Root layout — Spec 001 REQ-003, Spec 002 REQ-040, REQ-049.
 * One dark Stack. `initialRouteName` keeps Discover under a deep-linked event,
 * so the back control returns to Discover instead of closing the app.
 */
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/design/tokens';
import { t } from '@/i18n';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false, title: t('discover.title') }} />
        <Stack.Screen name="events/[slug]" options={{ title: '', headerBackTitle: t('event.backToEvents') }} />
        <Stack.Screen name="+not-found" options={{ title: t('notFound.title') }} />
      </Stack>
    </>
  );
}
