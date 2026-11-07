/**
 * Micro-interaction helpers. On web, Pressable reports `hovered`; transitions
 * are CSS on transform, opacity and colour only (never `all`). Under
 * prefers-reduced-motion nothing moves; colour still answers the pointer.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, type ViewStyle } from 'react-native';

export type InteractionState = { pressed: boolean; hovered?: boolean; focused?: boolean };

const EASE = 'cubic-bezier(.2,.8,.2,1)';

/** Web-only CSS transition, typed as a ViewStyle so StyleSheet arrays accept it. */
export function webTransition(properties: string[], ms = 180): ViewStyle | null {
  if (Platform.OS !== 'web') return null;
  return {
    transitionProperty: properties.join(', '),
    transitionDuration: `${ms}ms`,
    transitionTimingFunction: EASE,
  } as unknown as ViewStyle;
}

/** True when the OS or browser asks for reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
