/**
 * ЖЫЛ — жылдық мақсаттар тізімі (design/Zhyl.dc.html).
 *
 * ⚠ «Керек еді» мәні уақыттан емес, planned_progress() RPC-інен келеді
 * (CLAUDE.md §5.2). Макетте ол сызықтық есептелген — оны үлгі тұтпаңыз.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, formatDueShort, t as tpl } from '../../i18n/kk';
import {
  useYearGoalsWithStats, useChildStats, useHasChildren, type GoalWithStats,
} from '../../lib/goals';
import {
  Card, SectionLabel, ProgressRing, ProgressBar, PaceBadge,
} from '../../components/ui';
import {
  MenuIcon, PlusIcon, CalendarChipIcon, ChevronRightIcon,
} from '../../components/icons';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState<string | null>(null);

  const { data: goals, isLoading } = useYearGoalsWithStats(today);
  const list = goals ?? [];

  const avgActual = list.length
    ? Math.round(list.reduce((a, g) => a + g.actual, 0) / list.length)
    : 0;
  const avgPlanned = list.length
    ? Math.round(list.reduce((a, g) => a + g.planned, 0) / list.length)
    : 0;
  const ahead = list.filter((g) => g.gap > 0).length;
  const behind = list.filter((g) => g.gap < 0).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ ...centered, paddingTop: insets.top + 18, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MenuIcon size={22} />
        <Text style={styles.headerTitle}>{today.getFullYear()} ЖЫЛ</Text>
        <Pressable onPress={() => router.push('/goal/new')} hitSlop={10} accessibilityRole="button">
          <PlusIcon size={22} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : list.length === 0 ? (
          <EmptyGoals />
        ) : (
          <>
            {/* жылдық қорытынды */}
            <Card style={styles.pad}>
              <View style={styles.summaryRow}>
                <View style={{ flexShrink: 1 }}>
                  <SectionLabel>{kk.year.title}</SectionLabel>
                  <View style={styles.bigRow}>
                    <Text style={styles.big}>{avgActual}%</Text>
                    <Text style={styles.bigSub}>
                      {tpl(kk.year.fromGoals, { n: list.length })}
                    </Text>
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
                plannedPct={avgPlanned}
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

            <SectionLabel style={{ paddingLeft: 4, marginTop: 8 }}>
              {kk.year.goals}
            </SectionLabel>

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

function GoalCard({
  item,
  open,
  onToggle,
  today,
}: {
  item: GoalWithStats;
  open: boolean;
  onToggle: () => void;
  today: Date;
}) {
  const { goal, color, actual, gap } = item;
  const { data: months } = useChildStats(open ? goal.id : null, today);
  const due = new Date(goal.period_end + 'T00:00:00');

  // ⚠ §5.2b: балалары жоқ мақсат 0% КӨРСЕТПЕЙДІ — «Бөлінбеген» деп тұрады
  const divided = useHasChildren(goal.id);

  const maxPct = Math.max(...(months ?? []).map((m) => m.pct), 1);

  return (
    <Card level="cardSm" radius={R.cardSm} style={styles.goalCard}>
      <Pressable onPress={onToggle} style={styles.goalHead} accessibilityRole="button">
        {divided ? (
          <ProgressRing
            pct={actual}
            size={44}
            strokeWidth={5}
            color={color}
            trackColor={C.tintRing}
            numberSize={11}
            showPercentSign={false}
          />
        ) : (
          <View style={styles.undividedRing}>
            <Text style={styles.undividedDash}>—</Text>
          </View>
        )}

        <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
          <Text style={styles.goalTitle} numberOfLines={2}>{goal.title}</Text>
          <View style={styles.goalMeta}>
            <View style={styles.dueChip}>
              <CalendarChipIcon size={9} color={C.inkMuted} />
              <Text style={styles.dueText}>{formatDueShort(due)}</Text>
            </View>
            {divided ? (
              <PaceBadge gap={gap} />
            ) : (
              <View style={styles.undividedChip}>
                <Text style={styles.undividedChipText}>{kk.goal.undivided}</Text>
              </View>
            )}
            {goal.target_amount != null && (
              <Text style={styles.goalSub}>
                {goal.target_amount} {goal.unit ?? ''}
              </Text>
            )}
          </View>
        </View>

        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <ChevronRightIcon size={16} color={C.inkIcon} />
        </View>
      </Pressable>

      {open && (
        <View style={styles.expanded}>
          <SectionLabel style={{ marginBottom: 9 }}>{kk.year.byMonth}</SectionLabel>

          {!months ? (
            <ActivityIndicator color={C.accent} />
          ) : months.length === 0 ? (
            <Pressable
              onPress={() => router.push(`/goal/${goal.id}/stage/new` as never)}
              style={styles.addStage}
              accessibilityRole="button"
            >
              <Text style={styles.addStageText}>{kk.goal.addStage}</Text>
            </Pressable>
          ) : (
            <View style={styles.monthBars}>
              {months.map((m) => (
                <View key={m.goal.id} style={styles.monthCol}>
                  <View style={styles.monthTrack}>
                    <View
                      style={[
                        styles.monthFill,
                        {
                          height: `${Math.max((m.pct / maxPct) * 100, 6)}%`,
                          backgroundColor: m.pct === 0 ? C.lineField : color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.monthLabel} numberOfLines={1}>
                    {m.goal.title.slice(0, 3)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={() => router.push(`/goal/${goal.id}` as never)}
            style={styles.more}
            accessibilityRole="button"
          >
            <Text style={styles.moreText}>{kk.year.more}</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

function EmptyGoals() {
  return (
    <Card style={styles.pad}>
      <SectionLabel>Мақсат жоқ</SectionLabel>
      <Text style={styles.emptyTitle}>Жылдық мақсаттан бастаңыз</Text>
      <Text style={styles.emptyText}>
        Мақсат құрғанда мерзімін өзіңіз таңдайсыз — жыл соңы болуы міндетті емес.
        Жүйе жүктемені айларға бөліп береді, ал «керек еді» белгісі сол бөлуден
        есептеледі.
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: { fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink },
  body: { paddingHorizontal: gutter, gap: 10 },
  center: { paddingVertical: 40, alignItems: 'center' },
  pad: { padding: 18 },

  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
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

  goalCard: { paddingHorizontal: 16, paddingVertical: 15 },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalTitle: { fontFamily: font.title, fontSize: 13.5, letterSpacing: -0.14, color: C.ink },
  goalMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  dueChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.trackChip, borderRadius: R.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  dueText: { fontFamily: font.bold, fontSize: 10, color: C.inkBody },
  goalSub: { fontFamily: font.title, fontSize: 10, color: C.inkFaint },

  expanded: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.trackChip },
  monthBars: { flexDirection: 'row', gap: 4, height: 46 },
  monthCol: { flexGrow: 1, flexBasis: 0, alignItems: 'center', gap: 4 },
  monthTrack: {
    width: '100%', flexGrow: 1, borderRadius: R.micro,
    backgroundColor: C.trackChip, justifyContent: 'flex-end', overflow: 'hidden',
  },
  monthFill: { width: '100%', borderRadius: R.micro },
  monthLabel: { fontFamily: font.bold, fontSize: 7, color: C.ink4 },
  undividedRing: {
    width: 44, height: 44, borderRadius: R.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.trackChip, flexShrink: 0,
  },
  undividedDash: { fontFamily: font.bold, fontSize: 16, color: C.ink4 },
  undividedChip: {
    backgroundColor: C.trackChip, borderRadius: R.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  undividedChipText: { fontFamily: font.bold, fontSize: 10, color: C.inkMuted },
  addStage: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
    borderRadius: R.sm, backgroundColor: C.tint,
  },
  addStageText: { fontFamily: font.bold, fontSize: 12, color: C.accentDeep },
  more: { alignSelf: 'flex-end', paddingTop: 11 },
  moreText: { fontFamily: font.bold, fontSize: 11, color: C.accent },

  emptyTitle: { fontFamily: font.bold, fontSize: 17, letterSpacing: -0.34, color: C.ink, marginTop: 8 },
  emptyText: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.inkProse, marginTop: 8 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 14, borderRadius: R.cardXs, backgroundColor: C.accent,
  },
  emptyBtnText: { fontFamily: font.bold, fontSize: 13, color: '#FFFFFF' },
});
