/**
 * Localization per locale and English fallback — Spec 001 REQ-006, Scenario 5;
 * Spec 002 NFR-001. Native modules are mocked in jest.setup.js.
 */
import { render, screen } from '@testing-library/react-native';

import NotFoundScreen from '../src/app/+not-found';
import { DiscoverScreen } from '../src/features/events/screens/DiscoverScreen';
import { resetEventCaches } from '../src/features/events/use-events';
import { createTranslator, setLocale, SUPPORTED_LOCALES, type Locale } from '../src/i18n';
import en from '../src/i18n/locales/en';
import ru from '../src/i18n/locales/ru';
import vi from '../src/i18n/locales/vi';

const dictionaries = { en, vi, ru };

afterEach(() => {
  setLocale('en');
  resetEventCaches();
});

describe.each([...SUPPORTED_LOCALES])('screens in "%s" (REQ-006)', (locale: Locale) => {
  test('Discover shows the locale strings', async () => {
    setLocale(locale);
    await render(<DiscoverScreen />);
    expect(screen.getByText(dictionaries[locale].discover.title)).toBeTruthy();
    expect(await screen.findByText(dictionaries[locale].discover.sampleBanner)).toBeTruthy();
  });

  test('not-found shows the locale strings', async () => {
    setLocale(locale);
    await render(<NotFoundScreen />);
    expect(screen.getByText(dictionaries[locale].notFound.title)).toBeTruthy();
    expect(screen.getByLabelText(dictionaries[locale].notFound.goHome)).toBeTruthy();
  });
});

describe('English fallback (REQ-006, Scenario 5)', () => {
  const incomplete = {
    en,
    vi: { ...vi, notFound: { title: vi.notFound.title } },
    ru: { ...ru, notFound: {} },
  };

  test.each(['vi', 'ru'] as const)('a key missing in "%s" shows English and is reported', (locale) => {
    const report = jest.fn();
    const translator = createTranslator(incomplete, locale, report);

    expect(translator.t('notFound.body')).toBe(en.notFound.body);
    expect(report).toHaveBeenCalledWith(locale, 'notFound.body');
  });

  test('a key present in the active locale is used and not reported', () => {
    const report = jest.fn();
    const translator = createTranslator(incomplete, 'vi', report);

    expect(translator.t('notFound.title')).toBe(vi.notFound.title);
    expect(report).not.toHaveBeenCalled();
  });

  test('the development reporter warns once per missing key', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const translator = createTranslator(incomplete, 'ru');

    translator.t('notFound.body');
    translator.t('notFound.body');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('notFound.body');
    warn.mockRestore();
  });

  test('interpolation works in the fallback path', () => {
    const translator = createTranslator({ en, vi: { ...vi, discover: {} }, ru }, 'vi', () => undefined);
    expect(translator.t('discover.subtitle', { city: 'Da Nang' })).toBe("What's on in Da Nang");
  });
});
