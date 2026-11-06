/**
 * English (EN) locale — source of truth for all translation keys.
 * All other locale files must contain the same keys.
 *
 * Keys use nested objects. Access via t('home.title') etc.
 */
const en = {
  app: {
    name: 'MOVA',
  },
  home: {
    title: 'Welcome to MOVA',
    tagline: "Discover what's happening in Da Nang",
    comingSoon: 'Events in Da Nang are coming soon.',
  },
  notFound: {
    title: 'Page not found',
    body: "This page doesn't exist.",
    goHome: 'Go to home',
  },
};

// Derive the shape type from the EN locale for structural checking of other locales
export type LocaleSection = { [key: string]: string };
export type LocaleShape = { [K in keyof typeof en]: LocaleSection };

export type TranslationKeys =
  | 'app.name'
  | 'home.title'
  | 'home.tagline'
  | 'home.comingSoon'
  | 'notFound.title'
  | 'notFound.body'
  | 'notFound.goHome';

export default en;
