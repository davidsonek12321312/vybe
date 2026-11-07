/**
 * A small icon set drawn with Views, so it renders the same on iOS, Android
 * and web without an icon-font dependency. Icons are decorative: the control
 * that holds one carries the accessible name.
 */
import { StyleSheet, View } from 'react-native';

import { colors } from './tokens';

type IconProps = { size?: number; color?: string };

/** `aria-hidden` works on iOS, Android and web (react-native-web ignores accessibilityElementsHidden). */
const hidden = { 'aria-hidden': true } as const;

/** A chevron drawn from two borders of a rotated square. */
function Chevron({ size = 18, color = colors.text, rotate }: IconProps & { rotate: string }) {
  const arm = Math.round(size * 0.48);
  return (
    <View {...hidden} style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: arm,
          height: arm,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          borderBottomLeftRadius: 1,
          transform: [{ rotate }],
        }}
      />
    </View>
  );
}

export const ChevronLeft = (p: IconProps) => <Chevron {...p} rotate="45deg" />;
export const ChevronDown = (p: IconProps) => <Chevron {...p} rotate="-45deg" />;
export const ChevronRight = (p: IconProps) => <Chevron {...p} rotate="-135deg" />;

/** Share: an arrow leaving an open tray. */
export function ShareIcon({ size = 20, color = colors.text }: IconProps) {
  const tray = Math.round(size * 0.7);
  return (
    <View {...hidden} style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.06,
          width: tray,
          height: tray * 0.55,
          borderWidth: 2,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
      <View style={{ position: 'absolute', top: size * 0.12, width: 2, height: size * 0.58, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: size * 0.1 }}>
        <Chevron size={size * 0.62} color={color} rotate="135deg" />
      </View>
    </View>
  );
}

/** Map pin: a rounded teardrop with a hole. */
export function PinIcon({ size = 18, color = colors.text }: IconProps) {
  const drop = size * 0.7;
  return (
    <View {...hidden} style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: drop,
          height: drop,
          borderWidth: 2,
          borderColor: color,
          borderTopLeftRadius: drop / 2,
          borderTopRightRadius: drop / 2,
          borderBottomLeftRadius: drop / 2,
          // The square corner (bottom right) turns to point straight down.
          transform: [{ translateY: -size * 0.08 }, { rotate: '45deg' }],
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View style={{ width: drop * 0.28, height: drop * 0.28, borderRadius: drop, backgroundColor: color }} />
      </View>
    </View>
  );
}

/** Close: two crossed bars. */
export function CloseIcon({ size = 18, color = colors.text }: IconProps) {
  const bar = { position: 'absolute' as const, width: size * 0.9, height: 2, borderRadius: 1, backgroundColor: color };
  return (
    <View {...hidden} style={[styles.box, { width: size, height: size }]}>
      <View style={[bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[bar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

/** A live dot with a soft halo (Happening now). */
export function LiveDot({ size = 8, color = colors.success }: IconProps) {
  return (
    <View {...hidden} style={[styles.box, { width: size * 2, height: size * 2 }]}>
      <View style={{ position: 'absolute', width: size * 2, height: size * 2, borderRadius: size, backgroundColor: color, opacity: 0.22 }} />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

/**
 * The MOVA mark: a sun half set on the sea, with two swells under it.
 * Used in the wordmark and, larger, in empty and error states.
 */
export function SunMark({ size = 20, color = colors.accent, sea = colors.sea }: IconProps & { sea?: string }) {
  const sun = size * 0.62;
  return (
    <View {...hidden} style={{ width: size, height: size * 0.72, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ width: sun, height: sun / 2, borderTopLeftRadius: sun, borderTopRightRadius: sun, backgroundColor: color }} />
      <View style={{ width: size, height: Math.max(2, size * 0.08), borderRadius: 2, backgroundColor: color, marginTop: size * 0.05 }} />
      <View style={{ width: size * 0.66, height: Math.max(2, size * 0.07), borderRadius: 2, backgroundColor: sea, marginTop: size * 0.07 }} />
      <View style={{ width: size * 0.34, height: Math.max(2, size * 0.06), borderRadius: 2, backgroundColor: sea, opacity: 0.7, marginTop: size * 0.06 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
