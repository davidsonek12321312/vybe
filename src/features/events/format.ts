/**
 * Display helpers for event facts (NFR-001: locale-aware VND and labels).
 */
import { t } from '@/i18n';

import type { EventSummary } from './types';

const INTL_LOCALES: Record<string, string> = { en: 'en-GB', vi: 'vi-VN', ru: 'ru-RU' };

export function formatVnd(amount: number, locale: string): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale] ?? 'en-GB', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function priceLabel(event: Pick<EventSummary, 'price'>, locale: string): string {
  return event.price.type === 'free' ? t('event.free') : formatVnd(event.price.vnd, locale);
}

export function languageCodes(event: Pick<EventSummary, 'languages'>): string {
  return event.languages.map((language) => (language === 'other' ? t('language.other') : language.toUpperCase())).join(' · ');
}

export function languageNames(event: Pick<EventSummary, 'languages'>): string {
  return event.languages.map((language) => t(`language.${language}`)).join(', ');
}

export function venueLine(event: Pick<EventSummary, 'venue' | 'area'>): string {
  return event.venue.status === 'confirmed' && event.venue.name
    ? `${event.venue.name} · ${event.area}`
    : `${t('event.venueTbc')} · ${event.area}`;
}

/** "Da Nang" from "da-nang" until the city row is loaded. */
export function cityLabelFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}
