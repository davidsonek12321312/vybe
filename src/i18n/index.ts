/**
 * MOVA i18n module — Spec 001 REQ-006 (requirements v0.3)
 *
 * Every user-facing string resolves through this layer and the locale files
 * in ./locales/. Supported locales: EN, VI, RU.
 *
 * Fallback is deterministic: when the active locale lacks a key, the English
 * string is returned, and in development the missing key is reported once per
 * locale and key. Spec 001 has no in-app language switcher; setLocale() is
 * for the test harness and later specs.
 */
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en, { type TranslationKeys } from './locales/en';
import ru from './locales/ru';
import vi from './locales/vi';

export type Locale = 'en' | 'vi' | 'ru';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'vi', 'ru'];
export const FALLBACK_LOCALE: Locale = 'en';

export type Dictionary = { [key: string]: string | Dictionary };
export type Dictionaries = Record<Locale, Dictionary>;
export type MissingKeyReporter = (locale: Locale, key: string) => void;

export type TranslateParams = Record<string, string | number>;

export interface Translator {
  t(key: TranslationKeys, params?: TranslateParams): string;
  setLocale(locale: Locale): void;
  getLocale(): Locale;
}

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'vi' || value === 'ru';
}

function hasTranslation(dictionary: Dictionary, key: string): boolean {
  let node: string | Dictionary | undefined = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return false;
    node = node[part];
  }
  return typeof node === 'string' && node.trim().length > 0;
}

/** Development-only reporter: warns once per missing locale and key. */
export function createDevReporter(): MissingKeyReporter {
  const reported = new Set<string>();
  return (locale, key) => {
    if (!__DEV__) return;
    const id = `${locale}:${key}`;
    if (reported.has(id)) return;
    reported.add(id);
    console.warn(`[i18n] Missing "${locale}" translation for "${key}"; showing English.`);
  };
}

export function createTranslator(
  dictionaries: Dictionaries,
  initialLocale: Locale,
  reportMissing: MissingKeyReporter = createDevReporter(),
): Translator {
  const i18n = new I18n(dictionaries);
  i18n.defaultLocale = FALLBACK_LOCALE;
  // The fallback is decided explicitly below, not by i18n-js locale chains.
  i18n.enableFallback = false;
  let locale = initialLocale;

  return {
    t(key, params) {
      if (locale !== FALLBACK_LOCALE && !hasTranslation(dictionaries[locale], key)) {
        reportMissing(locale, key);
        return i18n.t(key, { ...params, locale: FALLBACK_LOCALE });
      }
      return i18n.t(key, { ...params, locale });
    },
    setLocale(next) {
      locale = next;
    },
    getLocale() {
      return locale;
    },
  };
}

function readDeviceLanguage(): string | null {
  try {
    return getLocales()[0]?.languageCode ?? null;
  } catch {
    // Server rendering has no device locale; English is the deterministic default.
    return null;
  }
}

const deviceLanguage = readDeviceLanguage();
const appTranslator = createTranslator(
  { en, vi, ru },
  isSupportedLocale(deviceLanguage) ? deviceLanguage : FALLBACK_LOCALE,
);

/** Translate a key in the active locale, falling back to English. Interpolates %{name}. */
export function t(key: TranslationKeys, params?: TranslateParams): string {
  return appTranslator.t(key, params);
}

/** Select the active locale (test harness; no UI switcher in Spec 001). */
export function setLocale(locale: Locale): void {
  appTranslator.setLocale(locale);
}

/** Return the active locale code. */
export function getActiveLocale(): Locale {
  return appTranslator.getLocale();
}
