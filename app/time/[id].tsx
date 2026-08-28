/**
 * УАҚЫТ ЕСЕБІ — бір мақсат.
 *
 * Аптаның күндері, қай әрекетке қанша уақыт кеткені және өткен аптамен
 * салыстыру. ‹ › арқылы кез келген өткен аптаны ашуға болады: аптаның
 * қалай өзгергенін көру үшін артқа қайту керек.
 *
 * ⚠ Болашақ аптаға өтуге болмайды: әлі болмаған нәрсенің есебі жоқ.
 *
 * ⚠ Бұл уақыт мақсаттың пайызына кірмейді (CLAUDE.md §1).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, formatDayMonth } from '../../i18n/kk';
import { goBack } from '../../lib/nav';
import { errorText } from '../../lib/errors';
import { useBreakpoint } from '../../lib/breakpoints';
import { useGoals } from '../../lib/goals';
import {
  useGoalWeek, useGoalTotal, fmtMinutes, fmtShort, startOfWeek, addDays,
} from '../../lib/report';
import { Card, DarkCard, SectionLabel } from '../../components/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';

const CHART_H = 132;

export default function GoalTimeScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const now = new Date();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goals } = useGoals();
  const goal = (goals ?? []).find((g) => g.id === id) ?? null;

  /** Қай аптаны көрсетіп тұр — ‹ › осыны жылжытады */
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));

  const rep = useGoalWeek(id ?? null, weekStart, now);
  const allTime = useGoalTotal(id ?? null, now);

  const peak = Math.max(1, ...rep.days.map((d) => d.minutes));
  const thisWeek = startOfWeek(now).getTime() === rep.from.getTime();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...centered,
        paddingTop: insets.top + (wide ? 18 : 12),
        paddingBottom: insets.bottom + 28,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/time')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {goal?.title ?? kk.time.title}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.body}>
        {/* Мақсаттың бүкіл уақыты — аптадан бөлек, өзгермейтін сан */}
        <DarkCard style={styles.hero}>
          <Text style={styles.heroLabel}>{kk.time.goalTotal}</Text>
          <Text style={styles.heroValue}>{allTime > 0 ? fmtMinutes(allTime) : '—'}</Text>
        </DarkCard>

        {/* ── Апта ауыстырғышы ── */}
        <Card style={styles.pad}>
          <View style={styles.weekHead}>
            <Pressable
              onPress={() => setWeekStart((w) => addDays(w, -7))}
              style={styles.arrow}
              accessibilityRole="button"
              accessibilityLabel={kk.time.prevWeek}
            >
              <ChevronLeftIcon size={14} color={C.ink3} strokeWidth={2.4} />
            </Pressable>

            <View style={{ flexGrow: 1, alignItems: 'center' }}>
              <Text style={styles.weekRange}>
                {formatDayMonth(rep.from)} — {formatDayMonth(rep.to)}
              </Text>
              {thisWeek && <Text style={styles.weekNow}>{kk.time.thisWeek}</Text>}
            </View>

            <Pressable
              onPress={() => rep.canGoNext && setWeekStart((w) => addDays(w, 7))}
              disabled={!rep.canGoNext}
              style={[styles.arrow, !rep.canGoNext && { opacity: 0.3 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.time.nextWeek}
            >
              <ChevronRightIcon size={14} color={C.ink3} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.total}>{rep.total > 0 ? fmtMinutes(rep.total) : '—'}</Text>
            {rep.delta != null && rep.delta !== 0 && (
              <Text
                style={[styles.delta, { color: rep.delta > 0 ? C.accentDeep : C.ink3 }]}
              >
                {rep.delta > 0 ? '+' : '−'}
                {fmtMinutes(Math.abs(rep.delta))}
              </Text>
            )}
          </View>

          <Text style={styles.sub}>
            {rep.delta == null
              ? kk.time.noCompare
              : `${kk.time.prevWeekWas} ${fmtMinutes(rep.prevTotal)}`}
          </Text>

          {/* ── Күндік бағаналар ── */}
          {rep.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : rep.isError ? (
            <Text style={styles.error}>{errorText(rep.error)}</Text>
          ) : (
            <View style={styles.chart}>
              {rep.days.map((d) => {
                const h = Math.max(
                  Math.round((d.minutes / peak) * (CHART_H - 30)),
                  d.minutes ? 6 : 3,
                );
                return (
                  <View key={d.date.toISOString()} style={styles.col}>
                    <Text style={[styles.colTop, d.today && { color: C.accentDeep }]}>
                      {fmtShort(d.minutes)}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        { height: h },
                        d.minutes === 0 && { backgroundColor: C.lineSoft },
                      ]}
                    />
                    <Text style={[styles.colLabel, d.today && styles.colLabelOn]}>
                      {d.short}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* ── Қай әрекетке қанша ── */}
        <SectionLabel style={{ paddingLeft: 4 }}>{kk.time.byAction}</SectionLabel>

        <Card style={styles.pad}>
          {rep.actions.length === 0 ? (
            <Text style={styles.empty}>{kk.time.emptyWeek}</Text>
          ) : (
            rep.actions.map((a, i) => (
              <View key={a.id} style={[styles.actionRow, i > 0 && styles.line]}>
                <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                  <Text style={styles.actionName} numberOfLines={1}>
                    {a.title}
                  </Text>
                  {a.date && (
                    <Text style={styles.actionDate}>
                      {formatDayMonth(new Date(a.date + 'T00:00:00'))}
                    </Text>
                  )}
                </View>

                <View style={styles.actionRight}>
                  <Text style={styles.actionTime}>{fmtMinutes(a.minutes)}</Text>
                  <View style={styles.miniTrack}>
                    <View
                      style={{
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: C.accent,
                        width: `${rep.total ? (a.minutes / rep.total) * 100 : 0}%`,
                      }}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        <Text style={styles.footer}>{kk.time.notCounted}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: font.bold, fontSize: 14, letterSpacing: -0.28,
    color: C.ink, flexShrink: 1,
  },

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  center: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, marginTop: 12 },
  empty: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.ink4 },

  hero: { paddingHorizontal: 18, paddingVertical: 15 },
  heroLabel: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.accent2,
  },
  heroValue: {
    fontFamily: font.display, fontSize: 24, letterSpacing: -1,
    color: '#FFFFFF', marginTop: 7,
  },

  weekHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 30, height: 30, borderRadius: R.boxSm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardSoft, borderWidth: 1, borderColor: C.lineField,
  },
  weekRange: { fontFamily: font.bold, fontSize: 13.5, color: C.ink },
  weekNow: { fontFamily: font.bold, fontSize: 9.5, letterSpacing: 0.9, color: C.accent, marginTop: 2 },

  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 14 },
  total: { fontFamily: font.display, fontSize: 25, letterSpacing: -1, color: C.ink },
  delta: { fontFamily: font.bold, fontSize: 12 },
  sub: { fontFamily: font.prose, fontSize: 11, color: C.inkMuted, marginTop: 5 },

  chart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 7,
    height: CHART_H, marginTop: 14,
  },
  col: {
    flexGrow: 1, flexShrink: 1, alignItems: 'center',
    justifyContent: 'flex-end', gap: 7, height: '100%',
  },
  colTop: { fontFamily: font.bold, fontSize: 9, color: C.ink4 },
  bar: {
    width: '100%', maxWidth: 40, borderRadius: R.boxSm, backgroundColor: C.accent,
  },
  colLabel: { fontFamily: font.body, fontSize: 10, color: C.inkMuted },
  colLabelOn: { fontFamily: font.bold, color: C.accentDeep },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  line: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  actionName: { fontFamily: font.title, fontSize: 13, color: C.ink },
  actionDate: { fontFamily: font.body, fontSize: 11, color: C.ink4, marginTop: 3 },
  actionRight: { width: 96, flexShrink: 0, alignItems: 'flex-end', gap: 6 },
  actionTime: { fontFamily: font.bold, fontSize: 12.5, color: C.ink },
  miniTrack: {
    width: '100%', height: 4, borderRadius: 999,
    backgroundColor: C.tintBar, overflow: 'hidden',
  },

  footer: {
    fontFamily: font.prose, fontSize: 11, lineHeight: 16,
    color: C.ink4, textAlign: 'center', marginTop: 4, paddingHorizontal: 10,
  },
});
