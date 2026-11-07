/**
 * i18n smoke tests — REQ-006, REQ-005
 *
 * expo-localization is mocked globally in jest.setup.js
 *
 * Verifies that:
 * - All top-level sections in EN locale are present in VI and RU
 * - All keys within each section exist in VI and RU
 * - t('home.comingSoon') returns a non-empty string (REQ-005)
 */

import en from '../src/i18n/locales/en';
import vi from '../src/i18n/locales/vi';
import ru from '../src/i18n/locales/ru';
import { t } from '../src/i18n';

// Use index signatures to avoid TypeScript literal-type mismatch
const enAny = en as Record<string, Record<string, string>>;
const viAny = vi as Record<string, Record<string, string>>;
const ruAny = ru as Record<string, Record<string, string>>;

describe('i18n locale completeness (REQ-006)', () => {
  const sections = Object.keys(enAny);

  test('all EN sections are present in VI locale', () => {
    const missing = sections.filter((s) => !(s in viAny));
    expect(missing).toEqual([]);
  });

  test('all EN sections are present in RU locale', () => {
    const missing = sections.filter((s) => !(s in ruAny));
    expect(missing).toEqual([]);
  });

  test('all EN keys within sections are present in VI locale', () => {
    const missing: string[] = [];
    for (const section of sections) {
      for (const key of Object.keys(enAny[section])) {
        if (!(key in (viAny[section] ?? {}))) {
          missing.push(`${section}.${key}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  test('all EN keys within sections are present in RU locale', () => {
    const missing: string[] = [];
    for (const section of sections) {
      for (const key of Object.keys(enAny[section])) {
        if (!(key in (ruAny[section] ?? {}))) {
          missing.push(`${section}.${key}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('t() function', () => {
  test('returns a non-empty string', () => {
    const result = t('discover.title');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('interpolates parameters (Spec 002 NFR-001)', () => {
    expect(t('discover.subtitle', { city: 'Da Nang' })).toBe("What's on in Da Nang");
    expect(t('discover.count', { count: 4 })).toBe('Events: 4');
  });
});

describe('i18n placeholders (CR-16)', () => {
  const placeholders = (text: string) => [...text.matchAll(/%\{(\w+)\}/g)].map((m) => m[1]).sort();

  test('VI and RU use the same %{placeholders} as EN for every key', () => {
    const mismatched: string[] = [];
    for (const section of Object.keys(enAny)) {
      for (const [key, value] of Object.entries(enAny[section])) {
        for (const [name, locale] of [['vi', viAny], ['ru', ruAny]] as const) {
          const other = locale[section]?.[key];
          if (typeof other === 'string' && placeholders(other).join() !== placeholders(value).join()) {
            mismatched.push(`${name}:${section}.${key}`);
          }
        }
      }
    }
    expect(mismatched).toEqual([]);
  });
});
