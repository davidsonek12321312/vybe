/**
 * MOVA UI primitives on the Afterglow tokens. Every pressable answers hover
 * (web), press and keyboard focus; motion stays on transform and colour.
 */
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextProps, type ViewProps } from 'react-native';

import { ChevronDown } from './icons';
import { webTransition, type InteractionState } from './motion';
import { MIN_TOUCH, colors, radii, spacing, typography, type TypographyVariant } from './tokens';

/** Visible keyboard focus on the dark theme (the browser default is near-black on near-black). */
export const focusRing = {
  outlineWidth: 2,
  outlineStyle: 'solid',
  outlineColor: colors.text,
  outlineOffset: 2,
} as const;

type TextTone = 'primary' | 'secondary' | 'accent' | 'sea' | 'success' | 'warning' | 'danger' | 'onAccent';

const toneColor: Record<TextTone, string> = {
  primary: colors.text,
  secondary: colors.textSecondary,
  accent: colors.accent,
  sea: colors.sea,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  onAccent: colors.onAccent,
};

export function AppText({
  variant = 'body',
  tone = 'primary',
  style,
  ...rest
}: TextProps & { variant?: TypographyVariant; tone?: TextTone }) {
  return <Text style={[typography[variant], { color: toneColor[tone] }, style]} {...rest} />;
}

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

/**
 * A filter chip, with the role that matches what it does (WCAG 4.1.2):
 * - `checkbox`: a toggle, or one option of a multi-choice group;
 * - `radio`: one option of a single-choice group;
 * - `opensSheet`: a button that opens a choice dialog. It has no checked state;
 *   its value is in its name ("Language: RU"), so the selection is still
 *   exposed (NFR-002).
 * State is passed as aria-checked: react-native-web 0.21 ignores
 * accessibilityState, and `selected` would become an invalid aria-selected on a
 * button (review CR-7).
 */
export function Chip({
  label,
  selected = false,
  onPress,
  accessibilityHint,
  accessibilityLabel,
  opensSheet = false,
  kind = 'checkbox',
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
  /** The accessible name when it should say more than the visible label ("Date: This weekend"). */
  accessibilityLabel?: string;
  /** Shows a chevron: the chip opens a choice sheet instead of toggling. */
  opensSheet?: boolean;
  kind?: 'checkbox' | 'radio';
}) {
  const roleProps = opensSheet
    ? ({ accessibilityRole: 'button', 'aria-haspopup': 'dialog' } as const)
    : ({ accessibilityRole: kind, 'aria-checked': selected } as const);
  return (
    <Pressable
      {...roleProps}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed, hovered, focused }: InteractionState) => [
        styles.chip,
        webTransition(['background-color', 'border-color', 'transform'], 150),
        hovered && !selected && styles.chipHover,
        selected && styles.chipSelected,
        pressed && styles.pressed,
        focused && focusRing,
      ]}>
      <Text style={[typography.label, { color: selected ? colors.onAccent : colors.text }]}>{label}</Text>
      {opensSheet ? <ChevronDown size={14} color={selected ? colors.onAccent : colors.textSecondary} /> : null}
    </Pressable>
  );
}

export type BadgeTone = 'neutral' | 'accent' | 'sea' | 'success' | 'warning' | 'danger';

const badgeInk: Record<BadgeTone, string> = {
  neutral: colors.textSecondary,
  accent: colors.accent,
  sea: colors.sea,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

/** Text badge with a coloured dot: the colour never carries the meaning alone. */
export function Badge({ label, tone = 'neutral', onPhoto = false }: { label: string; tone?: BadgeTone; onPhoto?: boolean }) {
  return (
    <View style={[styles.badge, onPhoto && styles.badgeOnPhoto]}>
      <View style={[styles.badgeDot, { backgroundColor: badgeInk[tone] }]} />
      <Text style={[typography.label, styles.badgeText, { color: onPhoto ? colors.text : badgeInk[tone] }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  accessibilityHint,
  accessibilityRole = 'button',
  icon,
  grow = true,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link';
  icon?: ReactNode;
  grow?: boolean;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed, hovered, focused }: InteractionState) => [
        styles.button,
        grow && styles.buttonGrow,
        webTransition(['background-color', 'border-color', 'transform'], 150),
        primary ? styles.buttonPrimary : variant === 'secondary' ? styles.buttonSecondary : styles.buttonGhost,
        hovered && (primary ? styles.buttonPrimaryHover : styles.buttonSecondaryHover),
        hovered && styles.lift,
        pressed && styles.buttonPressed,
        focused && focusRing,
      ]}>
      {icon}
      <Text style={[typography.subheading, { color: primary ? colors.onAccent : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Round icon-only control; `onPhoto` gives it a dark glass ground for use over images. */
export function IconButton({
  label,
  onPress,
  children,
  onPhoto = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  onPhoto?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed, hovered, focused }: InteractionState) => [
        styles.iconButton,
        onPhoto ? styles.iconButtonPhoto : styles.iconButtonPlain,
        webTransition(['background-color', 'transform'], 150),
        hovered && styles.iconButtonHover,
        pressed && styles.buttonPressed,
        focused && focusRing,
      ]}>
      {children}
    </Pressable>
  );
}

/**
 * Heading semantics with a level: web gets h1–h3 (one h1 a page), native
 * gets the header role, which has no levels.
 */
export function headingProps(level: 1 | 2 | 3): TextProps {
  if (Platform.OS !== 'web') return { accessibilityRole: 'header' };
  return { role: 'heading', 'aria-level': level } as TextProps;
}

/** Small uppercase section label with an optional count. */
export function Eyebrow({ children, tone = 'secondary' }: { children: string; tone?: TextTone }) {
  return (
    <AppText variant="eyebrow" tone={tone}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  chip: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.chip,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipHover: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.raised,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.raised,
  },
  badgeOnPhoto: {
    backgroundColor: colors.glass,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonGrow: {
    flexGrow: 1,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonPrimaryHover: {
    backgroundColor: '#FF8D70',
  },
  buttonSecondary: {
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryHover: {
    borderColor: colors.borderStrong,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  lift: {
    transform: [{ translateY: -1 }],
  },
  buttonPressed: {
    transform: [{ translateY: 1 }, { scale: 0.985 }],
    opacity: 0.92,
  },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPhoto: {
    backgroundColor: colors.glass,
  },
  iconButtonPlain: {
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonHover: {
    backgroundColor: colors.raised,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
