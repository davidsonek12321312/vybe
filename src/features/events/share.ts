/**
 * Sharing — Spec 002 REQ-013. Native share sheet; on web the Web Share API,
 * else copy the link and announce it to screen readers.
 */
import * as Linking from 'expo-linking';
import { AccessibilityInfo, Platform, Share } from 'react-native';

export function eventUrl(slug: string, siteUrl: string | null): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/events/${slug}`;
  }
  if (siteUrl) return `${siteUrl}/events/${slug}`;
  return Linking.createURL(`/events/${slug}`);
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

export async function shareLink(input: { url: string; title: string; copiedMessage: string }): Promise<ShareResult> {
  const { url, title, copiedMessage } = input;
  try {
    if (Platform.OS !== 'web') {
      await Share.share({ message: `${title}\n${url}`, url, title });
      return 'shared';
    }
    const nav: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator;
    if (nav && typeof nav.share === 'function') {
      await nav.share({ title, url });
      return 'shared';
    }
    if (nav?.clipboard && typeof nav.clipboard.writeText === 'function') {
      await nav.clipboard.writeText(url);
      AccessibilityInfo.announceForAccessibility(copiedMessage);
      return 'copied';
    }
    return 'failed';
  } catch (error) {
    return error instanceof Error && error.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
