/**
 * MOVA UI primitives on the dark design tokens (Spec 002 design A4).
 */
import { Pressable, StyleSheet, Text, View, type TextProps, type ViewProps } from 'react-native';

import { MIN_TOUCH, colors, radii, spacing, typography, type TypographyVariant } from './tokens';

type PressState = { pressed: boolean; focused?: boolean };

/** Visible keyboard focus on the dark theme (the browser default is near-black on near-black). */
export const focusRing = {
  outlineWidth: 2,
  outlineStyle: 'solid',
  outlineColor: colors.text,
  outlineOffset: 2,
} as const;

type TextTone = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'onAccent';

const toneColor: Record<TextTone, string> = {
  primary: colors.text,
  secondary: colors.textSecondary,
  accent: colors.accent,
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

export function Chip({
  label,
  selected = false,
  onPress,
  accessibilityHint,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      // A toggle: role checkbox + checked (aria-checked on web). `selected` on a
      // button becomes an invalid aria-selected there (review CR-7).
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed, focused }: PressState) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
        focused && focusRing,
      ]}>
      <Text style={[typography.label, { color: selected ? colors.onAccent : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const badgeColor: Record<BadgeTone, string> = {
  neutral: colors.textSecondary,
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  return (
    <View style={[styles.badge, { borderColor: badgeColor[tone] }]}>
      <Text style={[typography.label, { color: badgeColor[tone] }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  accessibilityHint,
  accessibilityRole = 'button',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link';
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed, focused }: PressState) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && styles.pressed,
        focused && focusRing,
      ]}>
      <Text style={[typography.subheading, { color: primary ? colors.onAccent : colors.text }]}>{label}</Text>
    </Pressable>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.chip,
    backgroundColor: colors.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  button: {
    minHeight: 48,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    flexGrow: 1,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: colors.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
});
