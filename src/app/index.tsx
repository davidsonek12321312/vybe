/**
 * Route "/" — Discover (Spec 002 REQ-001; replaces the Spec 001 "coming soon"
 * shell). generateMetadata gives the server-rendered page its title and
 * Open Graph tags (REQ-047).
 */
import type { Metadata } from 'expo-server';

import { cityLabelFromSlug } from '@/features/events/format';
import { getAppContext } from '@/features/events/repository';
import { DiscoverScreen } from '@/features/events/screens/DiscoverScreen';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  const context = getAppContext();
  const city = cityLabelFromSlug(context.ok ? context.config.defaultCity : 'da-nang');
  const title = t('meta.siteTitle', { city });
  const description = t('meta.siteDescription', { city });
  const siteUrl = context.ok ? context.config.siteUrl : null;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', ...(siteUrl ? { url: siteUrl } : {}) },
  };
}

export default function DiscoverRoute(): React.JSX.Element {
  return <DiscoverScreen />;
}
