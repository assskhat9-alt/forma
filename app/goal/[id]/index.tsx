/**
 * МАҚСАТ — айлар тізімі.
 *
 * Айларды ЖҮЙЕ ашқан (`sync_months()` триггері). Пайдаланушы оларды
 * құрмайды, ат қоймайды, күн таңдамайды. Бос ай да тізімде тұрады —
 * ішіне кіріп әрекет қосуға болады.
 *
 * ⚠ Пайыз әрекет САНЫМЕН есептеледі, салмақ жоқ. Көп әрекет тұрған ай
 * үлесті өзі көп алады.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { differenceInCalendarDays } from 'date-fns';

import { color as C, radius as R, font, gutter, centered } from '../../../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../../../i18n/kk';
import { useGoals, useMonths, useNodeStats, useChildrenStats } from '../../../lib/goals';
import { Card, DarkCard, SectionLabel, ProgressBar } from '../../../components/ui';
import { ChevronLeftIcon, DotsIcon, CalendarChipIcon, ChevronRightIcon } from '../../../components/icons';

export default function GoalDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useMemo(() => new Date(), []);

  const { data: goals, isLoading } = useGoals();
  const goal = (goals ?? []).find((g) => g.id === id) ?? null;

  const months = useMonths(goal?.id ?? null);
  const { data: stats } = useNodeStats(goal?.id ?? null, today);
  const { data: monthStats } = useChildrenStats(months, today);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Мақсат табылмады.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{kk.signIn.back}</Text>
        </Pressable>
      </View>
    );
  }

  const due = new Date(goal.period_end + 'T00:00:00');
  const daysLeft = Math.max(differenceInCalendarDays(due, today), 0);
  const actual = stats?.actual ?? 0;
  const planned = stats?.planned ?? 0;
  const gap = stats?.gap ?? 0;
  const hasActions = (stats?.total ?? 0) > 0;

  /** Мерзімнен тыс қалып қойған айлар — әрекеттері бар болғандықтан сақталған */
  const orphans = months.filter(
    (m) => m.period_end < goal.period_start || m.period_start > goal.period_end,
  );

  const statOf = (mid: string) => (monthStats ?? []).find((s) => s.goal.id === mid);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...centered,
        paddingTop: insets.top + 18,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.goal.title}</Text>
        <DotsIcon size={22} />
      </View>

      <View style={styles.body}>
        {/* hero */}
        <DarkCard style={styles.hero}>
          <Text style={styles.heroLabel}>{kk.period.year}</Text>
          <Text style={styles.heroTitle}>{goal.title}</Text>

          <View style={styles.heroRow}>
            <View style={styles.heroPctRow}>
              <Text style={styles.heroPct}>{hasActions ? `${actual}%` : '0%'}</Text>
              <Text style={styles.heroPctSub}>{kk.goal.completed}</Text>
            </View>

            <View style={styles.dueBox}>
              <CalendarChipIcon size={14} color={C.accentOnDark} />
              <View>
                <Text style={styles.dueDate}>{formatDayMonth(due)}</Text>
                <Text style={styles.dueLeft}>{tpl(kk.goal.daysLeft, { n: daysLeft })}</Text>
              </View>
            </View>
          </View>

          <ProgressBar
            pct={actual}
            plannedPct={hasActions ? planned : undefined}
            height={8}
            color={C.accentOnDark}
            trackColor={C.darkTrack}
            markerColor="#FFFFFF"
            style={{ marginTop: 14 }}
          />

          <View style={styles.heroLegend}>
            <Text style={styles.heroLegendText}>
              {hasActions ? (
                <>
                  {tpl(kk.goal.needed, { planned })} ·{' '}
                  <Text style={{ color: '#FFFFFF' }}>
                    {gap === 0
                      ? kk.goal.onTrack
                      : gap > 0
                        ? tpl(kk.goal.ahead, { n: gap })
                        : tpl(kk.goal.behind, { n: Math.abs(gap) })}
                  </Text>
                </>
              ) : (
                kk.goal.noActions
              )}
            </Text>
          </View>

          {/* Нәтиже — пайызға қатыспайды */}
          {goal.result_to != null && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{kk.goalNew.result}</Text>
              <Text style={styles.resultValue}>
                {goal.result_from != null ? `${fmt(goal.result_from)} → ` : ''}
                {fmt(goal.result_to)} {goal.result_unit ?? ''}
              </Text>
            </View>
          )}
        </DarkCard>

        {/* мерзімнен тыс қалған айлар */}
        {orphans.length > 0 && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              {tpl(kk.goal.orphanWarning, { n: orphans.length })}
            </Text>
          </View>
        )}

        {/* АЙЛАР — жүйе ашқан қаңқа */}
        <SectionLabel style={{ paddingLeft: 4, marginTop: 4 }}>{kk.goal.months}</SectionLabel>

        {months.map((m) => {
          const st = statOf(m.id);
          const total = st?.total ?? 0;
          const done = st?.done ?? 0;
          const pct = st?.actual ?? 0;
          const current = m.period_start <= toIso(today) && m.period_end >= toIso(today);

          return (
            <Pressable
              key={m.id}
              onPress={() => router.push(`/month/${m.id}` as never)}
              accessibilityRole="button"
            >
              <Card level="cardSm" radius={R.cardSm} style={styles.monthCard}>
                <View style={styles.monthHead}>
                  <View style={[styles.monthBadge, current && { backgroundColor: C.accent }]}>
                    <Text style={[styles.monthBadgeText, current && { color: '#FFFFFF' }]}>
                      {total > 0 ? pct : '—'}
                    </Text>
                  </View>

                  <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                    <View style={styles.monthTitleRow}>
                      <Text style={styles.monthTitle}>{m.title}</Text>
                      {current && (
                        <View style={styles.currentChip}>
                          <Text style={styles.currentText}>{kk.goal.current}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.monthRange}>
                      {formatDayMonth(new Date(m.period_start + 'T00:00:00'))} —{' '}
                      {formatDayMonth(new Date(m.period_end + 'T00:00:00'))}
                    </Text>
                  </View>

                  <View style={styles.monthRight}>
                    <Text style={[styles.monthCount, total === 0 && { color: C.ink4 }]}>
                      {total === 0
                        ? kk.goal.addAction
                        : tpl(kk.goal.actionCount, { done, total })}
                    </Text>
                    <ChevronRightIcon size={15} color={C.inkIcon} />
                  </View>
                </View>

                {total > 0 && (
                  <ProgressBar
                    pct={pct}
                    color={current ? C.accent : C.accent5}
                    height={4}
                    style={{ marginTop: 10 }}
                  />
                )}
              </Card>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** Ондық бөлшек үтірмен жазылады (CLAUDE.md §9) */
const fmt = (n: number) => String(n).replace('.', ',');

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 12 },
  missing: { fontFamily: font.title, fontSize: 14, color: C.inkMuted },
  backBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: R.sm,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.lineField,
  },
  backBtnText: { fontFamily: font.bold, fontSize: 12.5, color: C.ink },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: { fontFamily: font.display, fontSize: 12, letterSpacing: 1.92, color: C.ink },
  body: { paddingHorizontal: gutter, gap: 10 },

  hero: { padding: 20 },
  heroLabel: {
    fontFamily: font.bold, fontSize: 10, letterSpacing: 1.2,
    textTransform: 'uppercase', color: C.accent2,
  },
  heroTitle: {
    fontFamily: font.display, fontSize: 21, letterSpacing: -0.63,
    lineHeight: 27, color: '#FFFFFF', marginTop: 9,
  },
  heroRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', marginTop: 16, gap: 12,
  },
  heroPctRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  heroPct: { fontFamily: font.display, fontSize: 36, letterSpacing: -1.44, color: '#FFFFFF' },
  heroPctSub: { fontFamily: font.title, fontSize: 11, color: C.darkInk2 },
  dueBox: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: R.chipSm,
    paddingHorizontal: 11, paddingVertical: 8,
  },
  dueDate: { fontFamily: font.bold, fontSize: 11.5, color: '#FFFFFF' },
  dueLeft: { fontFamily: font.body, fontSize: 9.5, color: C.darkInk2, marginTop: 1 },
  heroLegend: { marginTop: 10 },
  heroLegendText: { fontFamily: font.title, fontSize: 10.5, color: C.darkInk2 },

  resultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.darkLine,
  },
  resultLabel: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.darkInk3,
  },
  resultValue: { fontFamily: font.bold, fontSize: 13, color: '#FFFFFF' },

  warning: {
    backgroundColor: C.trackChip, borderRadius: R.sm,
    paddingHorizontal: 13, paddingVertical: 11,
  },
  warningText: { fontFamily: font.title, fontSize: 12, lineHeight: 18, color: C.ink2 },

  monthCard: { paddingHorizontal: 15, paddingVertical: 13 },
  monthHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthBadge: {
    width: 36, height: 36, borderRadius: R.box,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.tintRing2, flexShrink: 0,
  },
  monthBadgeText: { fontFamily: font.bold, fontSize: 11, color: C.accentDeep },
  monthTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  monthTitle: { fontFamily: font.title, fontSize: 13.5, color: C.ink },
  monthRange: { fontFamily: font.body, fontSize: 10.5, color: C.inkMuted, marginTop: 3 },
  currentChip: {
    backgroundColor: C.tint, borderRadius: R.pill,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  currentText: { fontFamily: font.bold, fontSize: 9, letterSpacing: 0.54, color: C.accentDeep },
  monthRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  monthCount: { fontFamily: font.bold, fontSize: 11, color: C.accent },
});
