/**
 * МАҚСАТ ДЕТАЛЬІ — design/Maqsat.dc.html.
 *
 * Қара hero — мақсат ЕМЕС нәрсе емес, керісінше: бұл мақсаттың өзі,
 * сондықтан ол ең қою карточка. «Керек еді» маркері planned_progress()
 * RPC-інен келеді, уақыттан есептелмейді (CLAUDE.md §5.2).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { differenceInCalendarDays } from 'date-fns';

import { color as C, radius as R, font, gutter } from '../../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../../i18n/kk';
import { useGoals, useGoalStats, useChildStats } from '../../lib/goals';
import { Card, DarkCard, SectionLabel, ProgressBar } from '../../components/ui';
import {
  ChevronLeftIcon, DotsIcon, CalendarChipIcon, ChatIcon,
} from '../../components/icons';

export default function GoalDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useMemo(() => new Date(), []);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const { data: goals, isLoading } = useGoals();
  const goal = (goals ?? []).find((g) => g.id === id) ?? null;

  const { data: stats } = useGoalStats(goal?.id ?? null, today);
  const { data: months } = useChildStats(goal?.id ?? null, today);

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
  const actual = Math.round(stats?.actual ?? 0);
  const planned = Math.round(stats?.planned ?? 0);
  const gap = Math.round(stats?.gap ?? 0);

  const stages = (months ?? []).filter((m) => m.goal.level === 'stage');
  const monthList = (months ?? []).filter((m) => m.goal.level === 'month');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 32 }}
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
          <Text style={styles.heroLabel}>
            {goal.level === 'year' ? kk.period.year : goal.level.toUpperCase()}
          </Text>
          <Text style={styles.heroTitle}>{goal.title}</Text>

          <View style={styles.heroRow}>
            <View style={styles.heroPctRow}>
              <Text style={styles.heroPct}>{actual}%</Text>
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
            plannedPct={planned}
            height={8}
            color={C.accentOnDark}
            trackColor={C.darkTrack}
            markerColor="#FFFFFF"
            style={{ marginTop: 14 }}
          />

          <View style={styles.heroLegend}>
            <Text style={styles.heroLegendText}>
              {tpl(kk.goal.needed, { planned })} ·{' '}
              <Text style={{ color: '#FFFFFF' }}>
                {gap === 0
                  ? kk.goal.onTrack
                  : gap > 0
                    ? tpl(kk.goal.ahead, { n: gap })
                    : tpl(kk.goal.behind, { n: Math.abs(gap) })}
              </Text>
            </Text>
          </View>
        </DarkCard>

        {/* кезеңдер — болса ғана */}
        {stages.length > 0 && (
          <Card style={styles.pad}>
            <SectionLabel style={{ marginBottom: 13 }}>{kk.goal.stages}</SectionLabel>
            <View style={styles.stageRow}>
              {stages.map((s, i) => {
                const done = s.pct >= 100;
                const now =
                  !done &&
                  s.goal.period_start <= toIso(today) &&
                  s.goal.period_end >= toIso(today);
                return (
                  <View key={s.goal.id} style={styles.stageItem}>
                    <View style={styles.stageCol}>
                      <View
                        style={[
                          styles.stageDot,
                          done && { backgroundColor: C.accent, borderColor: C.accent },
                          now && { borderColor: C.accent },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageNum,
                            done && { color: '#FFFFFF' },
                            now && { color: C.accentDeep },
                          ]}
                        >
                          {i + 1}
                        </Text>
                      </View>
                      <Text style={styles.stageName} numberOfLines={2}>{s.goal.title}</Text>
                    </View>
                    {i < stages.length - 1 && (
                      <View style={[styles.stageLine, done && { backgroundColor: C.accent }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* айлық бөлу */}
        {monthList.length > 0 && (
          <Card style={styles.padTight}>
            <SectionLabel style={{ marginBottom: 4, paddingHorizontal: 2 }}>
              {kk.goal.byMonth}
            </SectionLabel>

            {monthList.map((m, i) => {
              const isOpen = openMonth === m.goal.id;
              const current =
                m.goal.period_start <= toIso(today) && m.goal.period_end >= toIso(today);
              return (
                <Pressable
                  key={m.goal.id}
                  onPress={() => setOpenMonth((cur) => (cur === m.goal.id ? null : m.goal.id))}
                  style={[styles.monthRow, i < monthList.length - 1 && styles.monthDivider]}
                  accessibilityRole="button"
                >
                  <View style={styles.monthLeft}>
                    <View style={[styles.monthBadge, current && { backgroundColor: C.accent }]}>
                      <Text style={[styles.monthBadgeText, current && { color: '#FFFFFF' }]}>
                        {m.pct}
                      </Text>
                    </View>
                    <View style={{ flexGrow: 1, flexShrink: 1 }}>
                      <View style={styles.monthTitleRow}>
                        <Text style={styles.monthTitle}>{m.goal.title}</Text>
                        {current && (
                          <View style={styles.currentChip}>
                            <Text style={styles.currentText}>{kk.goal.current}</Text>
                          </View>
                        )}
                      </View>
                      <ProgressBar
                        pct={m.pct}
                        color={current ? C.accent : C.accent5}
                        height={4}
                        style={{ marginTop: 7 }}
                      />
                    </View>
                  </View>

                  {isOpen && m.goal.target_amount != null && (
                    <Text style={styles.monthAmount}>
                      {m.goal.target_amount} {m.goal.unit ?? ''} · {formatDayMonth(new Date(m.goal.period_start + 'T00:00:00'))} — {formatDayMonth(new Date(m.goal.period_end + 'T00:00:00'))}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </Card>
        )}

        {monthList.length === 0 && stages.length === 0 && (
          <Card style={styles.pad}>
            <Text style={styles.noChildren}>
              Бұл мақсат кезеңдерге бөлінбеген. Сондықтан «керек еді» мәні мерзім
              бойынша сызықтық есептеледі — каскад толық жұмыс істемейді.
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

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
  body: { paddingHorizontal: gutter, gap: 12 },

  hero: { padding: 20 },
  heroLabel: {
    fontFamily: font.bold, fontSize: 10, letterSpacing: 1.3,
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

  pad: { padding: 18 },
  padTight: { paddingHorizontal: 16, paddingVertical: 14 },

  stageRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stageItem: { flexDirection: 'row', alignItems: 'flex-start', flexGrow: 1 },
  stageCol: { alignItems: 'center', gap: 7, width: 62, flexShrink: 0 },
  stageDot: {
    width: 26, height: 26, borderRadius: R.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.lineSoft, borderWidth: 2, borderColor: C.line,
  },
  stageNum: { fontFamily: font.bold, fontSize: 11, color: C.ink4 },
  stageName: { fontFamily: font.bold, fontSize: 9, textAlign: 'center', color: C.inkBody },
  stageLine: { flexGrow: 1, height: 2, backgroundColor: C.line, marginTop: 12 },

  monthRow: { paddingVertical: 11 },
  monthDivider: { borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  monthLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthBadge: {
    width: 34, height: 34, borderRadius: R.box,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.tintRing2, flexShrink: 0,
  },
  monthBadgeText: { fontFamily: font.bold, fontSize: 11, color: C.accentDeep },
  monthTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  monthTitle: { fontFamily: font.title, fontSize: 13.5, color: C.ink },
  currentChip: {
    backgroundColor: C.tint, borderRadius: R.pill,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  currentText: { fontFamily: font.bold, fontSize: 9, letterSpacing: 0.54, color: C.accentDeep },
  monthAmount: {
    fontFamily: font.body, fontSize: 11, color: C.inkMuted,
    marginTop: 9, marginLeft: 46,
  },

  noChildren: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.inkProse },
});
