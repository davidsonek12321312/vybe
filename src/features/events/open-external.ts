/**
 * Opens a vetted https URL outside the app (REQ-012, REQ-018, REQ-053).
 */
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { isHttpsUrl } from './links';

export function openExternal(url: string): void {
  if (!isHttpsUrl(url)) return;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  void Linking.openURL(url);
}
