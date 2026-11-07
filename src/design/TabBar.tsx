/**
 * Bottom tab bar (amendment v0.7, CEO reference design): five icons, the active one
 * filled white. Only Discover exists today; the others are visibly dimmed and
 * disabled until their specs ship, so nothing here is a dead button or fake data.
 * Icons are drawn with Views (no icon dependency) and are decorative: each tab
 * carries its own accessible name.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';

import { colors, spacing } from './tokens';

type TabKey = 'discover' | 'events' | 'create' | 'people' | 'chat';

const TABS: readonly { key: TabKey; enabled: boolean }[] = [
  { key: 'discover', enabled: true },
  { key: 'events', enabled: false },
  { key: 'create', enabled: false },
  { key: 'people', enabled: false },
  { key: 'chat', enabled: false },
];

const hidden = { 'aria-hidden': true } as const;
const STROKE = 2.2;

function Icon({ tab, active }: { tab: TabKey; active: boolean }) {
  const ink = colors.text;
  const fill = active ? ink : 'transparent';
  const cut = active ? colors.bg : ink;
  return (
    <View {...hidden} style={styles.iconBox}>
      {tab === 'discover' ? (
        <View style={[styles.home, { borderColor: ink, backgroundColor: fill }]}>
          <View style={[styles.dot, { borderColor: cut }]} />
        </View>
      ) : null}
      {tab === 'events' ? (
        <View style={[styles.calendar, { borderColor: ink, backgroundColor: fill }]}>
          <View style={[styles.calendarRule, { backgroundColor: cut }]} />
          <View style={styles.calendarDots}>
            <View style={[styles.calendarDot, { backgroundColor: cut }]} />
            <View style={[styles.calendarDot, { backgroundColor: cut }]} />
          </View>
        </View>
      ) : null}
      {tab === 'create' ? (
        <View style={[styles.plusBox, { borderColor: ink, backgroundColor: fill }]}>
          <View style={[styles.plusBar, { backgroundColor: cut }]} />
          <View style={[styles.plusBar, styles.plusBarUp, { backgroundColor: cut }]} />
        </View>
      ) : null}
      {tab === 'people' ? (
        <>
          <View style={[styles.cardBack, { borderColor: ink }]} />
          <View style={[styles.cardFront, { borderColor: ink, backgroundColor: fill }]} />
        </>
      ) : null}
      {tab === 'chat' ? (
        <View style={[styles.chat, { borderColor: ink, backgroundColor: fill }]}>
          <View style={[styles.chatDash, { backgroundColor: cut }]} />
        </View>
      ) : null}
    </View>
  );
}

export function TabBar({ active = 'discover' }: { active?: TabKey }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      role="tablist"
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TABS.map(({ key, enabled }) => {
        const label = t(`tabs.${key}`);
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            role="tab"
            accessibilityRole="tab"
            accessibilityLabel={enabled ? label : `${label}, ${t('tabs.soon')}`}
            accessibilityState={{ selected: isActive, disabled: !enabled }}
            aria-selected={isActive}
            aria-disabled={!enabled}
            disabled={!enabled}
            style={[styles.tab, !enabled && styles.soon]}>
            <Icon tab={key} active={isActive} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tab: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  soon: { opacity: 0.45 },
  iconBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  home: {
    width: 26,
    height: 24,
    borderWidth: STROKE,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: STROKE - 0.4 },
  calendar: { width: 26, height: 26, borderWidth: STROKE, borderRadius: 7, paddingTop: 5, alignItems: 'center' },
  calendarRule: { width: 18, height: 2, borderRadius: 1 },
  calendarDots: { flexDirection: 'row', gap: 4, marginTop: 4 },
  calendarDot: { width: 4, height: 4, borderRadius: 2 },
  plusBox: { width: 26, height: 26, borderWidth: STROKE, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  plusBar: { position: 'absolute', width: 12, height: 2.4, borderRadius: 1 },
  plusBarUp: { transform: [{ rotate: '90deg' }] },
  cardBack: { position: 'absolute', width: 18, height: 22, borderWidth: STROKE, borderRadius: 6, transform: [{ rotate: '-14deg' }, { translateX: -3 }] },
  cardFront: { position: 'absolute', width: 18, height: 22, borderWidth: STROKE, borderRadius: 6, transform: [{ rotate: '10deg' }, { translateX: 3 }] },
  chat: { width: 28, height: 24, borderWidth: STROKE, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chatDash: { width: 10, height: 2.4, borderRadius: 1 },
});
