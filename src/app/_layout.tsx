/**
 * Root layout — REQ-003
 *
 * Provides the single Stack navigator for all routes in Spec 001.
 * Exactly two routes exist: "/" (index) and "+not-found".
 * No tab navigator. No extra routes.
 */
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { t } from '@/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#F5F5F5' : '#1A1A1A',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Stack.Screen
        name="index"
        options={{ title: t('app.name') }}
      />
      <Stack.Screen
        name="+not-found"
        options={{ title: t('notFound.title') }}
      />
    </Stack>
  );
}
