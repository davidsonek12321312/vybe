/**
 * MOVA dark design tokens, amendment v0.7 (CEO reference design): near-black
 * ground, white pill actions, one red signal colour. Replaces the Afterglow
 * coral palette of amendment v0.6. Every text/background pair in TEXT_PAIRS is
 * checked at >= 4.5:1 by __tests__/events/data.test.ts.
 */
export const colors = {
  bg: '#0B0B0C',
  surface: '#151618',
  raised: '#202226',
  border: '#2C2E33',
  borderStrong: '#4B4E55',
  text: '#FFFFFF',
  textSecondary: '#A7AAB2',
  /** White: primary pill actions, active filters and the active tab. */
  accent: '#FFFFFF',
  onAccent: '#0B0B0C',
  /** Tinted ground for highlighted rows. */
  accentSoft: '#25272C',
  /** Red signal: badges, unread dots, live and like. Never body text. */
  signal: '#FF2D55',
  /** Sea glass: the Solo-friendly signal. */
  sea: '#5CD6C5',
  seaSoft: '#12292A',
  success: '#5EE38F',
  warning: '#FFC24B',
  danger: '#FF6B6B',
  scrim: 'rgba(5, 5, 6, 0.78)',
  /** Chips laid on photographs: opaque enough for AA white text over a white photo. */
  glass: 'rgba(11, 11, 12, 0.84)',
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
  ['accent', 'accentSoft'],
  ['text', 'accentSoft'],
  ['onAccent', 'accent'],
  ['onAccent', 'warning'],
  ['onAccent', 'textSecondary'],
  ['sea', 'surface'],
  ['sea', 'seaSoft'],
  ['text', 'seaSoft'],
  ['success', 'surface'],
  ['warning', 'surface'],
  ['danger', 'surface'],
  ['danger', 'bg'],
];

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radii = { tile: 14, chip: 999, card: 20, sheet: 28, pill: 999 } as const;

/** System fonts (SF Pro, Roboto, system-ui) keep EN/VI/RU glyph coverage; the scale does the brand work. */
export const typography = {
  hero: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1.2 },
  display: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.9 },
  title: { fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -0.6 },
  heading: { fontSize: 22, lineHeight: 27, fontWeight: '700', letterSpacing: -0.3 },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  /** Event and group titles in the reference design: heavy, italic, upper case. */
  eventTitle: { fontSize: 24, lineHeight: 28, fontWeight: '800', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.4 },
  eventTitleLarge: { fontSize: 34, lineHeight: 38, fontWeight: '800', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.6 },
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Times, dates and prices line up in lists. */
export const tabularNums = { fontVariant: ['tabular-nums'] } as const;

/** Minimum touch target (NFR-002). */
export const MIN_TOUCH = 44;

/** Layout breakpoints (dp). */
export const breakpoints = { medium: 720, wide: 1080 } as const;

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
