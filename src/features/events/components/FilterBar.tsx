/**
 * Filter bar and sheets — Spec 002 REQ-021–028. Chips: Date, Solo, Language,
 * Price, Category. Sheets apply on "Apply"; AND across types, OR within one.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Chip } from '@/design/primitives';
import { colors, radii, spacing } from '@/design/tokens';
import { t } from '@/i18n';

import { activeFilterCount, NO_FILTERS } from '../filters';
import { EVENT_CATEGORIES, EVENT_LANGUAGES, type DateFilter, type Filters, type PriceFilter } from '../types';

type SheetKind = 'date' | 'language' | 'price' | 'category';

const DATE_OPTIONS: DateFilter[] = ['any', 'today', 'tomorrow', 'weekend', 'next7'];
const PRICE_OPTIONS: PriceFilter[] = ['any', 'free', 'paid'];

function dateLabel(value: DateFilter): string {
  return value === 'any' ? t('filters.any') : t(`filters.${value}`);
}

function priceOptionLabel(value: PriceFilter): string {
  return value === 'any' ? t('filters.priceAny') : t(`filters.${value}`);
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
  const active = activeFilterCount(filters);
  const multi = (base: string, count: number) => (count > 0 ? `${base} · ${count}` : base);

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip
          label={filters.date === 'any' ? t('filters.date') : dateLabel(filters.date)}
          selected={filters.date !== 'any'}
          onPress={() => setSheet('date')}
        />
        <Chip
          label={t('filters.solo')}
          selected={filters.soloOnly}
          onPress={() => onChange({ ...filters, soloOnly: !filters.soloOnly })}
        />
        <Chip
          label={multi(t('filters.language'), filters.languages.length)}
          selected={filters.languages.length > 0}
          onPress={() => setSheet('language')}
        />
        <Chip
          label={filters.price === 'any' ? t('filters.price') : priceOptionLabel(filters.price)}
          selected={filters.price !== 'any'}
          onPress={() => setSheet('price')}
        />
        <Chip
          label={multi(t('filters.category'), filters.categories.length)}
          selected={filters.categories.length > 0}
          onPress={() => setSheet('category')}
        />
      </ScrollView>
      <View style={styles.summary}>
        <AppText variant="caption" tone="secondary" accessibilityLiveRegion="polite">
          {t('discover.count', { count: resultCount })}
        </AppText>
        {active > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('filters.clearAll')}
            onPress={() => onChange(NO_FILTERS)}
            hitSlop={12}>
            <AppText variant="label" tone="accent">
              {t('filters.clearAll')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        {sheet ? (
          <FilterSheet
            key={sheet}
            kind={sheet}
            filters={filters}
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

function FilterSheet({
  kind,
  filters,
  onApply,
  onClose,
}: {
  kind: SheetKind;
  filters: Filters;
  onApply: (next: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(filters);
  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const title =
    kind === 'date'
      ? t('filters.date')
      : kind === 'language'
        ? t('filters.language')
        : kind === 'price'
          ? t('filters.price')
          : t('filters.category');

  return (
    <View style={styles.backdrop}>
      <Pressable style={styles.backdropTouch} accessibilityRole="button" accessibilityLabel={t('filters.close')} onPress={onClose} />
      <View style={styles.sheet} accessibilityViewIsModal>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {kind === 'language' || kind === 'category' ? (
          <AppText variant="caption" tone="secondary">
            {t('filters.sheetHint')}
          </AppText>
        ) : null}
        <View style={styles.options}>
          {kind === 'date'
            ? DATE_OPTIONS.map((value) => (
                <Chip key={value} label={dateLabel(value)} selected={draft.date === value} onPress={() => setDraft({ ...draft, date: value })} />
              ))
            : null}
          {kind === 'price'
            ? PRICE_OPTIONS.map((value) => (
                <Chip key={value} label={priceOptionLabel(value)} selected={draft.price === value} onPress={() => setDraft({ ...draft, price: value })} />
              ))
            : null}
          {kind === 'language'
            ? EVENT_LANGUAGES.map((value) => (
                <Chip
                  key={value}
                  label={t(`language.${value}`)}
                  selected={draft.languages.includes(value)}
                  onPress={() => setDraft({ ...draft, languages: toggle(draft.languages, value) })}
                />
              ))
            : null}
          {kind === 'category'
            ? EVENT_CATEGORIES.map((value) => (
                <Chip
                  key={value}
                  label={t(`category.${value}`)}
                  selected={draft.categories.includes(value)}
                  onPress={() => setDraft({ ...draft, categories: toggle(draft.categories, value) })}
                />
              ))
            : null}
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

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
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
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
