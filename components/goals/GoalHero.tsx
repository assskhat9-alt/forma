import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../../i18n/kk';
import type { Goal } from '../../lib/database.types';
import { DarkCard, ProgressBar } from '../ui';
import { CalendarChipIcon } from '../icons';

const fmt = (n: number) => String(n).replace('.', ',');

export function GoalHero({
  goal,
  actual,
  planned,
  gap,
  hasActions,
  due,
  daysLeft,
}: {
  goal: Goal;
  actual: number;
  planned: number;
  gap: number;
  hasActions: boolean;
  due: Date;
  daysLeft: number;
}) {
  return (
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
  );
}

const styles = StyleSheet.create({
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
});
