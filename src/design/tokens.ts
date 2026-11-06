/**
 * MOVA premium dark design tokens — Spec 002 REQ-049, design A4.
 * Every text/background pair in TEXT_PAIRS is checked at >= 4.5:1 by
 * __tests__/design/contrast.test.ts.
 */
export const colors = {
  bg: '#0B0B10',
  surface: '#15151D',
  raised: '#1F1F2A',
  border: '#2E2E3A',
  text: '#F5F5F7',
  textSecondary: '#A8A8B3',
  accent: '#9D8CFF',
  onAccent: '#0B0B10',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  scrim: 'rgba(11, 11, 16, 0.78)',
} as const;

export type ColorToken = keyof typeof colors;

/** Text colour on background colour pairs used by the UI. */
export const TEXT_PAIRS: readonly (readonly [ColorToken, ColorToken])[] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'raised'],
  ['textSecondary', 'bg'],
  ['textSecondary', 'surface'],
  ['textSecondary', 'raised'],
  ['accent', 'bg'],
  ['accent', 'surface'],
  ['accent', 'raised'],
  ['onAccent', 'accent'],
  ['success', 'surface'],
  ['warning', 'surface'],
  ['danger', 'surface'],
  ['danger', 'bg'],
];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radii = { chip: 12, card: 16, sheet: 24, pill: 999 } as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Minimum touch target (NFR-002). */
export const MIN_TOUCH = 44;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const v = hex.replace('#', '');
  const r = channel(parseInt(v.slice(0, 2), 16));
  const g = channel(parseInt(v.slice(2, 4), 16));
  const b = channel(parseInt(v.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between two #RRGGBB colours. */
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
