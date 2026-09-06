/**
 * ЖЫЛ — жылдық мақсаттар тізімі.
 *
 * ⚠ «Керек еді» мәні уақыттан емес, `planned_progress()` RPC-інен келеді:
 * ол — күні өтіп кеткен әрекеттердің үлесі. Эталон уақыт емес, адамның
 * өз жоспары.
 *
 * Пайыз әрекет САНЫМЕН есептеледі, салмақ жоқ.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, t as tpl } from '../../i18n/kk';
import { useYearGoalsWithStats } from '../../lib/goals';
import { Card, SectionLabel, ProgressBar } from '../../components/ui';
import { PlusIcon } from '../../components/icons';
import { TopBar } from '../../components/layout/TopBar';
import { useBreakpoint } from '../../lib/breakpoints';
import { GoalCard } from '../../components/goals/GoalCard';

export default function GoalsScreen() {
  const wide = useBreakpoint() !== 'phone';
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState<string | null>(null);

  const { data: goals, isLoading } = useYearGoalsWithStats(today);
  const list = goals ?? [];

  const withActions = list.filter((g) => g.total > 0);
  const avgActual = withActions.length
    ? Math.round(withActions.reduce((a, g) => a + g.actual, 0) / withActions.length)
    : 0;
  const avgPlanned = withActions.length
    ? Math.round(withActions.reduce((a, g) => a + g.planned, 0) / withActions.length)
    : 0;
  const ahead = withActions.filter((g) => g.gap > 0).length;
  const behind = withActions.filter((g) => g.gap < 0).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ ...centered, paddingTop: insets.top + 18, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      // ⚠ Сан пернетақтасында «Дайын» түймесі жоқ — тізімді сүйреп жабады
      keyboardDismissMode="on-drag"
    >
      {wide ? (
        <TopBar
          title={`${today.getFullYear()} жыл`}
          actions={
            <Pressable
              onPress={() => router.push('/goal/new')}
              style={styles.addBtn}
              accessibilityRole="button"
              accessibilityLabel="Жаңа мақсат"
            >
              <PlusIcon size={17} color="#FFFFFF" />
            </Pressable>
          }
        />
      ) : (
        // ⚠ ☰ алынды: жай сурет болатын. + те жоқ — телефонда
        // төменгі жолақтағы ◆ дәл сол істі істейді.
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{today.getFullYear()} ЖЫЛ</Text>
        </View>
      )}

      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : list.length === 0 ? (
          <EmptyGoals />
        ) : (
          <>
            <Card style={styles.pad}>
              <View style={styles.summaryRow}>
                <View style={{ flexShrink: 1 }}>
                  <SectionLabel>{kk.year.title}</SectionLabel>
                  <View style={styles.bigRow}>
                    <Text style={styles.big}>{avgActual}%</Text>
                    <Text style={styles.bigSub}>{tpl(kk.year.fromGoals, { n: list.length })}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <SectionLabel>{kk.year.pace}</SectionLabel>
                  <Text style={styles.paceNum}>
                    {avgActual - avgPlanned > 0 ? '+' : avgActual - avgPlanned < 0 ? '−' : ''}
                    {Math.abs(avgActual - avgPlanned)}%
                  </Text>
                </View>
              </View>

              <ProgressBar
                pct={avgActual}
                plannedPct={withActions.length > 0 ? avgPlanned : undefined}
                height={10}
                style={{ marginTop: 16 }}
              />

              <View style={styles.legend}>
                <Text style={styles.legendAccent}>
                  {tpl(kk.year.actualLabel, { pct: avgActual })}
                </Text>
                <Text style={styles.legendMuted}>
                  {tpl(kk.year.plannedLabel, { pct: avgPlanned })}
                </Text>
              </View>

              <Text style={styles.summaryNote}>
                {tpl(kk.year.summary, { total: list.length, ahead, behind })}
              </Text>
            </Card>

            <SectionLabel style={{ paddingLeft: 4, marginTop: 8 }}>{kk.year.goals}</SectionLabel>

            {list.map((g) => (
              <GoalCard
                key={g.goal.id}
                item={g}
                open={open === g.goal.id}
                onToggle={() => setOpen((cur) => (cur === g.goal.id ? null : g.goal.id))}
                today={today}
              />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function EmptyGoals() {
  return (
    <Card style={styles.pad}>
      <SectionLabel>Мақсат жоқ</SectionLabel>
      <Text style={styles.emptyTitle}>Жылдық мақсаттан бастаңыз</Text>
      <Text style={styles.emptyText}>
        Мерзімін өзіңіз таңдайсыз. Сақтағанда жүйе сол аралыққа түсетін
        айларды өзі ашады — сіз тек ішіне әрекет қосасыз.
      </Text>
      <Pressable
        onPress={() => router.push('/goal/new')}
        style={styles.emptyBtn}
        accessibilityRole="button"
      >
        <PlusIcon size={14} color="#FFFFFF" strokeWidth={2.8} />
        <Text style={styles.emptyBtnText}>{kk.goalNew.create}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { alignItems: 'center', paddingHorizontal: gutter, paddingBottom: 10 },
  addBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink },
  body: { paddingHorizontal: gutter, gap: 10 },
  center: { paddingVertical: 40, alignItems: 'center' },
  pad: { padding: 18 },

  summaryRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 12,
  },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 },
  big: { fontFamily: font.display, fontSize: 40, letterSpacing: -1.6, color: C.ink },
  bigSub: { fontFamily: font.title, fontSize: 12, color: C.inkMuted },
  paceNum: { fontFamily: font.bold, fontSize: 20, color: C.darkInk3, marginTop: 6 },

  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  legendAccent: { fontFamily: font.title, fontSize: 11, color: C.accent },
  legendMuted: { fontFamily: font.title, fontSize: 11, color: C.darkInk3 },
  summaryNote: {
    fontFamily: font.body, fontSize: 10.5, lineHeight: 16, color: C.inkFaint,
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.lineSoft,
  },

  emptyTitle: {
    fontFamily: font.bold, fontSize: 17, letterSpacing: -0.34,
    color: C.ink, marginTop: 8,
  },
  emptyText: {
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 19,
    color: C.inkProse, marginTop: 8,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 14, borderRadius: R.cardXs, backgroundColor: C.accent,
  },
  emptyBtnText: { fontFamily: font.bold, fontSize: 13, color: '#FFFFFF' },
});
