/**
 * Filters — Spec 002 REQ-021–028. Phone and tablet: a chip bar whose Date,
 * Language, Price and Category chips open a sheet that applies on "Apply".
 * Desktop: the same filters laid out in a side panel, where every choice is
 * visible and applies at once (design-lab proposal; see DESIGN_REVIEW.md).
 * AND across types, OR within one.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/design/icons';
import { useLayoutMode } from '@/design/layout';
import { AppText, Button, Chip, IconButton, headingProps } from '@/design/primitives';
import { colors, radii, spacing } from '@/design/tokens';
import { t } from '@/i18n';

import { activeFilterCount, NO_FILTERS } from '../filters';
import { EVENT_CATEGORIES, EVENT_LANGUAGES, type DateFilter, type EventCategory, type EventLanguage, type Filters, type PriceFilter } from '../types';

type SheetKind = 'date' | 'language' | 'price' | 'category';

const DATE_OPTIONS: DateFilter[] = ['any', 'today', 'tomorrow', 'weekend', 'next7'];
const PRICE_OPTIONS: PriceFilter[] = ['any', 'free', 'paid'];

function dateLabel(value: DateFilter): string {
  return value === 'any' ? t('filters.any') : t(`filters.${value}`);
}

function priceOptionLabel(value: PriceFilter): string {
  return value === 'any' ? t('filters.priceAny') : t(`filters.${value}`);
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Result count and "Clear all" (REQ-027). */
function Summary({ filters, onChange, resultCount }: { filters: Filters; onChange: (next: Filters) => void; resultCount: number }) {
  const active = activeFilterCount(filters);
  return (
    <View style={styles.summary}>
      <AppText variant="caption" tone="secondary" accessibilityLiveRegion="polite">
        {t('discover.count', { count: resultCount })}
      </AppText>
      {active > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('filters.clearAll')}
          onPress={() => onChange(NO_FILTERS)}
          hitSlop={12}
          style={({ pressed }) => [styles.clearAll, pressed && styles.pressed]}>
          <AppText variant="label" tone="accent">
            {t('filters.clearAll')}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function FilterBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  resultCount: number;
}) {
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const { mode } = useLayoutMode();
  // Show the active value(s) in the label (S6: "Language: RU"); a count when there are several.
  const withValues = (base: string, values: string[]) =>
    values.length === 0 ? base : values.length === 1 ? `${base}: ${values[0]}` : `${base}: ${values.join(', ')} · ${values.length}`;

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip
          label={filters.date === 'any' ? t('filters.date') : dateLabel(filters.date)}
          accessibilityLabel={filters.date === 'any' ? t('filters.date') : `${t('filters.date')}: ${dateLabel(filters.date)}`}
          selected={filters.date !== 'any'}
          onPress={() => setSheet('date')}
          opensSheet
        />
        <Chip
          label={t('filters.solo')}
          selected={filters.soloOnly}
          onPress={() => onChange({ ...filters, soloOnly: !filters.soloOnly })}
        />
        <Chip
          label={withValues(t('filters.language'), filters.languages.map((code) => code.toUpperCase()))}
          selected={filters.languages.length > 0}
          onPress={() => setSheet('language')}
          opensSheet
        />
        <Chip
          label={filters.price === 'any' ? t('filters.price') : priceOptionLabel(filters.price)}
          accessibilityLabel={
            filters.price === 'any' ? t('filters.price') : `${t('filters.price')}: ${priceOptionLabel(filters.price)}`
          }
          selected={filters.price !== 'any'}
          onPress={() => setSheet('price')}
          opensSheet
        />
        <Chip
          label={withValues(t('filters.category'), filters.categories.map((category) => t(`category.${category}`)))}
          selected={filters.categories.length > 0}
          onPress={() => setSheet('category')}
          opensSheet
        />
      </ScrollView>
      <Summary filters={filters} onChange={onChange} resultCount={resultCount} />
      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        {sheet ? (
          <FilterSheet
            key={sheet}
            kind={sheet}
            filters={filters}
            centered={mode !== 'compact'}
            onApply={(next) => {
              onChange(next);
              setSheet(null);
            }}
            onClose={() => setSheet(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

function OptionChips({ kind, draft, setDraft }: { kind: SheetKind; draft: Filters; setDraft: (next: Filters) => void }) {
  if (kind === 'date') {
    return DATE_OPTIONS.map((value) => (
      <Chip
        key={value}
        kind="radio"
        label={dateLabel(value)}
        selected={draft.date === value}
        onPress={() => setDraft({ ...draft, date: value })}
      />
    ));
  }
  if (kind === 'price') {
    return PRICE_OPTIONS.map((value) => (
      <Chip
        key={value}
        kind="radio"
        label={priceOptionLabel(value)}
        selected={draft.price === value}
        onPress={() => setDraft({ ...draft, price: value })}
      />
    ));
  }
  if (kind === 'language') {
    return EVENT_LANGUAGES.map((value: EventLanguage) => (
      <Chip
        key={value}
        label={t(`language.${value}`)}
        selected={draft.languages.includes(value)}
        onPress={() => setDraft({ ...draft, languages: toggle(draft.languages, value) })}
      />
    ));
  }
  return EVENT_CATEGORIES.map((value: EventCategory) => (
    <Chip
      key={value}
      label={t(`category.${value}`)}
      selected={draft.categories.includes(value)}
      onPress={() => setDraft({ ...draft, categories: toggle(draft.categories, value) })}
    />
  ));
}

/** A single-choice group is a radiogroup; a multi-choice group a plain group. Both are named. */
function groupProps(kind: SheetKind, title: string) {
  return {
    accessibilityRole: kind === 'date' || kind === 'price' ? ('radiogroup' as const) : undefined,
    accessibilityLabel: title,
  };
}

function sheetTitle(kind: SheetKind): string {
  return kind === 'date'
    ? t('filters.date')
    : kind === 'language'
      ? t('filters.language')
      : kind === 'price'
        ? t('filters.price')
        : t('filters.category');
}

function FilterSheet({
  kind,
  filters,
  centered,
  onApply,
  onClose,
}: {
  kind: SheetKind;
  filters: Filters;
  centered: boolean;
  onApply: (next: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(filters);

  return (
    <View style={[styles.backdrop, centered && styles.backdropCentered]}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('filters.close')} onPress={onClose} />
      <View style={[styles.sheet, centered && styles.sheetCentered]} accessibilityViewIsModal>
        {centered ? null : <View style={styles.handle} />}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitle}>
            <AppText variant="heading" accessibilityRole="header">
              {sheetTitle(kind)}
            </AppText>
            {kind === 'language' || kind === 'category' ? (
              <AppText variant="caption" tone="secondary">
                {t('filters.sheetHint')}
              </AppText>
            ) : null}
          </View>
          <IconButton label={t('filters.close')} onPress={onClose}>
            <CloseIcon size={16} />
          </IconButton>
        </View>
        <View style={styles.options} {...groupProps(kind, sheetTitle(kind))}>
          <OptionChips kind={kind} draft={draft} setDraft={setDraft} />
        </View>
        <View style={styles.actions}>
          <Button
            label={t('filters.reset')}
            variant="secondary"
            onPress={() =>
              setDraft({
                ...draft,
                ...(kind === 'date' ? { date: NO_FILTERS.date } : {}),
                ...(kind === 'price' ? { price: NO_FILTERS.price } : {}),
                ...(kind === 'language' ? { languages: [] } : {}),
                ...(kind === 'category' ? { categories: [] } : {}),
              })
            }
          />
          <Button label={t('filters.apply')} onPress={() => onApply(draft)} />
        </View>
      </View>
    </View>
  );
}

/** Desktop side panel: every filter visible, applied as it is chosen. */
export function FilterPanel({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  resultCount: number;
}) {
  const groups: { kind: SheetKind | 'solo'; title: string }[] = [
    { kind: 'date', title: t('filters.date') },
    { kind: 'solo', title: t('filters.solo') },
    { kind: 'language', title: t('filters.language') },
    { kind: 'price', title: t('filters.price') },
    { kind: 'category', title: t('filters.category') },
  ];
  return (
    <View style={styles.panel}>
      <Summary filters={filters} onChange={onChange} resultCount={resultCount} />
      {groups.map((group) => (
        <View key={group.kind} style={styles.panelGroup}>
          <AppText variant="eyebrow" tone="secondary" {...headingProps(2)}>
            {group.title}
          </AppText>
          <View style={styles.panelOptions} {...(group.kind === 'solo' ? {} : groupProps(group.kind, group.title))}>
            {group.kind === 'solo' ? (
              <Chip
                label={t('filters.soloOnly')}
                selected={filters.soloOnly}
                onPress={() => onChange({ ...filters, soloOnly: !filters.soloOnly })}
              />
            ) : (
              <OptionChips kind={group.kind} draft={filters} setDraft={onChange} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: 24,
  },
  clearAll: {
    minHeight: 24,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  backdropCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetCentered: {
    width: '100%',
    maxWidth: 520,
    borderRadius: radii.sheet,
    paddingTop: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sheetTitle: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  panel: {
    gap: spacing.xl,
  },
  panelGroup: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  panelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
