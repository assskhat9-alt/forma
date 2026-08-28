/**
 * Мақсатқа кеткен уақыт — мақсаттың өз бетінің ішінде.
 *
 * ⚠ Бөлек «уақыт есебі» бөлімі жоқ. Уақыт — мақсаттың бір қыры, оны
 * бөлек экранға шығарса адам оны мақсатпен байланыстырмайды.
 *
 * ‹ › арқылы өткен аптаға қайтуға болады: аптаның қалай өзгергенін
 * көру үшін артқа қарау керек. Болашақ аптаға өтуге болмайды.
 *
 * ⚠ Бұл уақыт мақсаттың ПАЙЫЗЫНА қатыспайды: пайыз орындалған
 * әрекеттен есептеледі, отырған сағаттан емес (CLAUDE.md §1).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDayMonth } from '../../i18n/kk';
import {
  useGoalWeek, useGoalTotal, fmtMinutes, fmtShort, startOfWeek, addDays,
} from '../../lib/report';
import { Card, SectionLabel } from '../ui';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';

const CHART_H = 96;

export function GoalTime({ goalId, now }: { goalId: string; now: Date }) {
  /** Қай аптаны көрсетіп тұр */
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));

  const rep = useGoalWeek(goalId, weekStart, now);
  const allTime = useGoalTotal(goalId, now);

  const peak = Math.max(1, ...rep.days.map((d) => d.minutes));
  const thisWeek = startOfWeek(now).getTime() === rep.from.getTime();

  // Уақыт мүлде жазылмаған мақсатта бос диаграмма тұрғаннан ештеңе
  // көрсетпеген артық — тек қысқа түсіндірме
  if (!rep.isLoading && allTime === 0) {
    return (
      <>
        <SectionLabel style={styles.head}>{kk.goal.timeSpent}</SectionLabel>
        <Card style={styles.pad}>
          <Text style={styles.empty}>{kk.goal.timeEmpty}</Text>
        </Card>
      </>
    );
  }

  return (
    <>
      <SectionLabel style={styles.head}>{kk.goal.timeSpent}</SectionLabel>

      <Card style={styles.pad}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{kk.goal.timeAll}</Text>
          <Text style={styles.totalValue}>{fmtMinutes(allTime)}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Апта ауыстырғышы ── */}
        <View style={styles.weekHead}>
          <Pressable
            onPress={() => setWeekStart((w) => addDays(w, -7))}
            style={styles.arrow}
            accessibilityRole="button"
            accessibilityLabel={kk.goal.prevWeek}
          >
            <ChevronLeftIcon size={13} color={C.ink3} strokeWidth={2.4} />
          </Pressable>

          <View style={{ flexGrow: 1, alignItems: 'center' }}>
            <Text style={styles.weekRange}>
              {formatDayMonth(rep.from)} — {formatDayMonth(rep.to)}
            </Text>
            <Text style={styles.weekSum}>
              {rep.total > 0 ? fmtMinutes(rep.total) : kk.goal.timeNone}
              {rep.delta != null && rep.delta !== 0
                ? `  ${rep.delta > 0 ? '+' : '−'}${fmtMinutes(Math.abs(rep.delta))}`
                : ''}
            </Text>
          </View>

          <Pressable
            onPress={() => rep.canGoNext && setWeekStart((w) => addDays(w, 7))}
            disabled={!rep.canGoNext}
            style={[styles.arrow, !rep.canGoNext && { opacity: 0.3 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.goal.nextWeek}
          >
            <ChevronRightIcon size={13} color={C.ink3} strokeWidth={2.4} />
          </Pressable>
        </View>

        {rep.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <>
            <View style={styles.chart}>
              {rep.days.map((d) => {
                const h = Math.max(
                  Math.round((d.minutes / peak) * (CHART_H - 26)),
                  d.minutes ? 5 : 3,
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

            {/* ── Қай әрекетке кеткені ── */}
            {rep.actions.length === 0 ? (
              <Text style={styles.weekEmpty}>
                {thisWeek ? kk.goal.timeWeekEmptyNow : kk.goal.timeWeekEmpty}
              </Text>
            ) : (
              <View style={styles.actions}>
                {rep.actions.map((a) => (
                  <View key={a.id} style={styles.actionRow}>
                    <Text style={styles.actionName} numberOfLines={1}>
                      {a.title}
                    </Text>
                    <Text style={styles.actionTime}>{fmtMinutes(a.minutes)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  head: { paddingLeft: 4, marginTop: 4 },
  pad: { padding: 17 },
  center: { paddingVertical: 26, alignItems: 'center' },
  empty: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.ink4 },

  totalRow: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', gap: 10,
  },
  totalLabel: { fontFamily: font.body, fontSize: 12, color: C.inkMuted, flexShrink: 1 },
  totalValue: { fontFamily: font.bold, fontSize: 17, letterSpacing: -0.34, color: C.ink },

  divider: { height: 1, backgroundColor: C.lineSoft, marginVertical: 14 },

  weekHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 28, height: 28, borderRadius: R.boxSm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardSoft, borderWidth: 1, borderColor: C.lineField,
  },
  weekRange: { fontFamily: font.bold, fontSize: 12, color: C.ink },
  weekSum: { fontFamily: font.body, fontSize: 11, color: C.inkMuted, marginTop: 2 },

  chart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6,
    height: CHART_H, marginTop: 12,
  },
  col: {
    flexGrow: 1, flexShrink: 1, alignItems: 'center',
    justifyContent: 'flex-end', gap: 5, height: '100%',
  },
  colTop: { fontFamily: font.bold, fontSize: 8.5, color: C.ink4 },
  bar: { width: '100%', maxWidth: 34, borderRadius: R.micro, backgroundColor: C.accent },
  colLabel: { fontFamily: font.body, fontSize: 9.5, color: C.inkMuted },
  colLabelOn: { fontFamily: font.bold, color: C.accentDeep },

  weekEmpty: {
    fontFamily: font.prose, fontSize: 11.5, lineHeight: 17,
    color: C.ink4, marginTop: 12,
  },

  actions: { marginTop: 13, gap: 9 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  },
  actionName: { fontFamily: font.body, fontSize: 12, color: C.inkBody, flexShrink: 1 },
  actionTime: { fontFamily: font.bold, fontSize: 12, color: C.ink, flexShrink: 0 },
});
