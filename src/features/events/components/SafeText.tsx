/**
 * Plain-text rendering of organiser text — Spec 002 REQ-018. No markup is
 * interpreted; only https URLs become tappable and open outside the app.
 */
import * as Linking from 'expo-linking';
import { Text, type TextProps } from 'react-native';

import { AppText } from '@/design/primitives';
import { colors } from '@/design/tokens';
import { t } from '@/i18n';

import { linkify } from '../links';

export function SafeText({ children, ...rest }: Omit<TextProps, 'children'> & { children: string }) {
  const segments = linkify(children);
  return (
    <AppText tone="secondary" {...rest}>
      {segments.map((segment, index) =>
        segment.kind === 'link' ? (
          <Text
            key={index}
            accessibilityRole="link"
            accessibilityHint={t('event.opensExternally')}
            style={{ color: colors.accent, textDecorationLine: 'underline' }}
            onPress={() => {
              void Linking.openURL(segment.value);
            }}>
            {segment.value}
          </Text>
        ) : (
          segment.value
        ),
      )}
    </AppText>
  );
}
