/**
 * Root layout — Spec 001 REQ-003, Spec 002 REQ-040, REQ-049.
 * Design lab: Afterglow theme colours, web theme-color and color-scheme.
 * One dark Stack. `anchor` keeps Discover under a deep-linked event,
 * so the back control returns to Discover instead of closing the app.
 */
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { colors } from '@/design/tokens';
import { t } from '@/i18n';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <Head>
        {/* Dark browser chrome, form controls and scrollbars (web audit). */}
        <meta name="theme-color" content={colors.bg} />
        <meta name="color-scheme" content="dark" />
      </Head>
      {Platform.OS === 'web' ? (
        // Focus rings for keyboard users only: a mouse click does not leave a ring (web audit).
        <style href="mova-focus-visible" precedence="default">
          {'*:focus:not(:focus-visible){outline:none !important}'}
        </style>
      ) : null}
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
        {/* The detail screen draws its own back control over the cover photo. */}
        <Stack.Screen name="events/[slug]" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="+not-found" options={{ title: t('notFound.title') }} />
      </Stack>
    </>
  );
}
