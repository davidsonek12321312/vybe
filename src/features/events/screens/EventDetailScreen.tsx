/**
 * Event details — Spec 002 REQ-010–020, 029–031, 040, 053.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Badge, Button, Card } from '@/design/primitives';
import { colors, radii, spacing } from '@/design/tokens';
import { getActiveLocale, t } from '@/i18n';

import { EventBadges } from '../components/EventBadges';
import { EventPoster } from '../components/EventPoster';
import { SafeText } from '../components/SafeText';
import { Banner, SkeletonCards, StateMessage, errorCopy } from '../components/StateViews';
import { languageNames, priceLabel } from '../format';
import { openExternal } from '../open-external';
import { getAppContext, type AppContext } from '../repository';
import { eventUrl, shareLink } from '../share';
import { deviceUsesCityTime, formatDay, formatLongDate, formatStamp, formatTime, hasEnded } from '../time';
import type { EventDetail, EventSummary } from '../types';
import { useEventDetail, useNow } from '../use-events';

type Shown = EventSummary & Partial<Omit<EventDetail, keyof EventSummary>>;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fact}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      {children}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="subheading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function EventDetailScreen({
  slug,
  initialEvent,
  initiallyNotAvailable = false,
  context = getAppContext(),
}: {
  slug: string;
  initialEvent?: EventDetail | null;
  initiallyNotAvailable?: boolean;
  context?: AppContext;
}) {
  const router = useRouter();
  const repository = context.ok ? context.repository : null;
  const siteUrl = context.ok ? context.config.siteUrl : null;
  const detail = useEventDetail(repository, slug, initialEvent, initiallyNotAvailable);
  const now = useNow();
  const locale = getActiveLocale();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const goToDiscover = () => router.replace('/');

  if (detail.status === 'not_available') {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <StateMessage
          title={t('states.notAvailableTitle')}
          body={t('states.notAvailableBody')}
          actionLabel={t('event.backToEvents')}
          onAction={goToDiscover}
        />
      </SafeAreaView>
    );
  }

  const event: Shown | null = detail.event ?? detail.summary;
  if (!event) {
    if (detail.status === 'error') {
      const copy = errorCopy(detail.errorKind);
      return (
        <SafeAreaView style={styles.screen} edges={['bottom']}>
          <StateMessage
            title={copy.title}
            body={copy.body}
            actionLabel={detail.errorKind === 'config' ? undefined : t('states.retry')}
            onAction={detail.retry}
            secondaryLabel={t('event.backToEvents')}
            onSecondary={goToDiscover}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        {detail.slow ? <StateMessage title={t('states.slow')} actionLabel={t('states.retry')} onAction={detail.retry} /> : null}
        <SkeletonCards count={1} />
      </SafeAreaView>
    );
  }

  const timeZone = event.city.timeZone;
  const ended = hasEnded(event, now);
  const cityTime = deviceUsesCityTime(now, timeZone) ? '' : ` (${t('event.cityTime', { city: event.city.name })})`;
  const when = `${formatLongDate(event.startsAt, locale, timeZone)} · ${formatTime(event.startsAt, locale, timeZone)}–${formatTime(event.endsAt, locale, timeZone)}${cityTime}`;
  const showUpdated = event.status === 'published' && !ended && event.materialChangedAt !== null && event.startsAt > now;
  const canRegister =
    !event.isSample && event.status === 'published' && !ended && typeof event.registrationUrl === 'string';

  const onShare = async () => {
    const result = await shareLink({
      url: eventUrl(event.slug, siteUrl),
      title: event.title,
      copiedMessage: t('event.linkCopied'),
    });
    setShareNote(result === 'copied' ? t('event.linkCopied') : result === 'failed' ? t('event.shareFailed') : null);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.column}>
          {!detail.event ? (
            detail.status === 'error' ? (
              <View style={styles.partial}>
                <Banner text={errorCopy(detail.errorKind).title} tone="warning" />
                {detail.errorKind === 'config' ? null : <Button label={t('states.retry')} variant="secondary" onPress={detail.retry} />}
              </View>
            ) : (
              <View style={styles.partial}>
                <Banner text={detail.slow ? t('states.slow') : t('states.loading')} tone="neutral" />
                {detail.slow ? <Button label={t('states.retry')} variant="secondary" onPress={detail.retry} /> : null}
              </View>
            )
          ) : null}
          {event.status === 'cancelled' ? (
            <View style={[styles.banner, styles.bannerDanger]} accessibilityRole="alert">
              <AppText variant="subheading" tone="danger">
                {t('status.cancelled')}
              </AppText>
              {event.cancellationNote ? <AppText tone="secondary">{event.cancellationNote}</AppText> : null}
            </View>
          ) : null}
          {ended && event.status !== 'cancelled' ? (
            <View style={[styles.banner, styles.bannerNeutral]} accessibilityRole="alert">
              <AppText variant="subheading">{t('status.ended')}</AppText>
            </View>
          ) : null}
          {showUpdated && event.materialChangedAt ? (
            <View style={[styles.banner, styles.bannerWarning]} accessibilityRole="alert">
              <AppText variant="subheading" tone="warning">
                {t('status.updatedAt', { when: formatStamp(event.materialChangedAt, locale, timeZone) })}
              </AppText>
              {event.changeNote ? <AppText tone="secondary">{event.changeNote}</AppText> : null}
            </View>
          ) : null}

          <View style={styles.poster}>
            <EventPoster event={event} height={220} weekday={formatDay(event.startsAt, locale, timeZone)} />
          </View>

          <View style={styles.titleBlock}>
            <AppText variant="title" accessibilityRole="header">
              {event.title}
            </AppText>
            <EventBadges event={event} now={now} />
          </View>

          <Card style={styles.facts}>
            <Fact label={t('event.when')}>
              <AppText>{when}</AppText>
            </Fact>
            <Fact label={t('event.where')}>
              <AppText>
                {event.venue.status === 'confirmed' && event.venue.name ? event.venue.name : t('event.venueToBeConfirmed')}
              </AppText>
              <AppText tone="secondary">
                {[event.venueAddress, event.area, event.city.name].filter(Boolean).join(' · ')}
              </AppText>
              {event.mapsUrl ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={t('event.openInMaps')}
                  accessibilityHint={t('event.opensExternally')}
                  onPress={() => openExternal(event.mapsUrl as string)}
                  style={styles.inlineLink}>
                  <AppText variant="label" tone="accent">
                    {t('event.openInMaps')}
                  </AppText>
                </Pressable>
              ) : null}
            </Fact>
            <Fact label={t('event.languages')}>
              <AppText>{languageNames(event)}</AppText>
            </Fact>
            <Fact label={t('event.price')}>
              <AppText>{priceLabel(event, locale)}</AppText>
              {event.paymentNote ? <AppText tone="secondary">{event.paymentNote}</AppText> : null}
            </Fact>
            {event.organizerName ? (
              <AppText variant="caption" tone="secondary">
                {t('event.organizer', { name: event.organizerName })}
              </AppText>
            ) : null}
          </Card>

          {event.soloFriendly && event.soloDetails ? (
            <View style={styles.solo}>
              <Badge label={t('badge.solo')} tone="accent" />
              <AppText variant="subheading" accessibilityRole="header">
                {t('solo.title')}
              </AppText>
              <AppText tone="secondary">{event.soloDetails}</AppText>
            </View>
          ) : null}

          {event.whatToExpect ? (
            <Section title={t('event.whatToExpect')}>
              <SafeText>{event.whatToExpect}</SafeText>
            </Section>
          ) : null}
          {event.description ? (
            <Section title={t('event.about')}>
              <SafeText>{event.description}</SafeText>
            </Section>
          ) : null}
          {event.ageRestriction ? (
            <AppText tone="warning">{t('event.ageRestriction', { age: event.ageRestriction })}</AppText>
          ) : null}
          {event.accessibilityNotes ? (
            <Section title={t('event.accessibility')}>
              <AppText tone="secondary">{event.accessibilityNotes}</AppText>
            </Section>
          ) : null}
          {event.updatedAt ? (
            <AppText variant="caption" tone="secondary">
              {t('event.lastUpdated', { date: formatStamp(event.updatedAt, locale, timeZone) })}
            </AppText>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={[styles.column, styles.bottomInner]}>
          {shareNote ? (
            <AppText variant="caption" tone="secondary" accessibilityLiveRegion="polite" style={styles.shareNote}>
              {shareNote}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <Button label={t('event.share')} variant={canRegister ? 'secondary' : 'primary'} onPress={() => void onShare()} />
            {canRegister ? (
              <Button
                label={`${t('event.register')} ↗`}
                accessibilityRole="link"
                accessibilityHint={t('event.registerHint')}
                onPress={() => openExternal(event.registrationUrl as string)}
              />
            ) : null}
          </View>
          {canRegister ? (
            <AppText variant="caption" tone="secondary" style={styles.shareNote}>
              {t('event.registerHint')}
            </AppText>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  column: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  banner: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  bannerDanger: { borderColor: colors.danger },
  bannerWarning: { borderColor: colors.warning },
  bannerNeutral: { borderColor: colors.border },
  partial: {
    gap: spacing.sm,
  },
  poster: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  titleBlock: {
    gap: spacing.sm,
  },
  facts: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fact: {
    gap: 2,
  },
  inlineLink: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  solo: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
  },
  bottomInner: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shareNote: {
    textAlign: 'center',
  },
});
