/**
 * Localization per locale and English fallback — Spec 001 REQ-006, Scenario 5
 *
 * - Home and not-found render the EN, VI and RU strings selected by the harness
 * - A key missing from VI or RU shows English without crashing
 * - The missing key is reported in development (once per locale and key)
 */
jest.mock('expo-router', () => ({
  Link: 'Link',
  Stack: { Screen: 'Stack.Screen' },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));

import { render } from '@testing-library/react-native';

import NotFoundScreen from '../src/app/+not-found';
import HomeScreen from '../src/app/index';
import { createTranslator, setLocale, SUPPORTED_LOCALES, type Locale } from '../src/i18n';
import en from '../src/i18n/locales/en';
import ru from '../src/i18n/locales/ru';
import vi from '../src/i18n/locales/vi';

const dictionaries = { en, vi, ru };

afterEach(() => {
  setLocale('en');
});

describe.each([...SUPPORTED_LOCALES])('shell screens in "%s" (REQ-006)', (locale: Locale) => {
  test('home shows the locale strings', () => {
    setLocale(locale);
    const { getByText } = render(<HomeScreen />);
    expect(getByText(dictionaries[locale].home.title)).toBeTruthy();
    expect(getByText(dictionaries[locale].home.comingSoon)).toBeTruthy();
  });

  test('not-found shows the locale strings', () => {
    setLocale(locale);
    const { getByText, getByLabelText } = render(<NotFoundScreen />);
    expect(getByText(dictionaries[locale].notFound.title)).toBeTruthy();
    expect(getByLabelText(dictionaries[locale].notFound.goHome)).toBeTruthy();
  });
});

describe('English fallback (REQ-006, Scenario 5)', () => {
  const incomplete = {
    en,
    vi: { ...vi, home: { title: vi.home.title } },
    ru: { ...ru, home: {} },
  };

  test.each(['vi', 'ru'] as const)('a key missing in "%s" shows English and is reported', (locale) => {
    const report = jest.fn();
    const translator = createTranslator(incomplete, locale, report);

    expect(translator.t('home.tagline')).toBe(en.home.tagline);
    expect(report).toHaveBeenCalledWith(locale, 'home.tagline');
  });

  test('a key present in the active locale is used and not reported', () => {
    const report = jest.fn();
    const translator = createTranslator(incomplete, 'vi', report);

    expect(translator.t('home.title')).toBe(vi.home.title);
    expect(report).not.toHaveBeenCalled();
  });

  test('the development reporter warns once per missing key', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const translator = createTranslator(incomplete, 'ru');

    translator.t('home.tagline');
    translator.t('home.tagline');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('home.tagline');
    warn.mockRestore();
  });
});
