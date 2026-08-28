/**
 * БҮГІН — басты экран (design/Main.dc.html).
 *
 * Екі бөлек блок, шатастыруға болмайды (CLAUDE.md §1):
 *   ақ карточка  → мақсаттар. Күндік сақина ТЕК осыдан есептеледі.
 *   үзік сызықты → әдеттер. Пайызға МҮЛДЕ қосылмайды.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, formatDayMonthWeekday, monthsUpper, t as tpl } from '../../i18n/kk';
import { weekNumber } from '../../lib/calendar';
import { useDayTasks, useToggleTask, useLevelBars } from '../../lib/goals';
import { useHabitsForDay, useToggleHabit } from '../../lib/habits';
import {
  Card, DarkCard, DashedCard, SectionLabel,
  ProgressRing, ProgressBar, Chip, CollapsibleSegments, HabitCell,
} from '../../components/ui';
import { MenuIcon, BellIcon, QuoteIcon, StarIcon } from '../../components/icons';
import { TaskRow } from '../../components/calendar/TaskRow';

const PERIODS = [kk.period.day, kk.period.week, kk.period.month, kk.period.year] as const;

const MOTTO = '«Мен армандаған адам — бүгін тұрып жасайтын адам.»';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date();

  const [period, setPeriod] = useState(0);
  const [segOpen, setSegOpen] = useState(true);

  const { tasks, isLoading, isError } = useDayTasks(today);
  const toggleTask = useToggleTask();
  const { data: bars } = useLevelBars(today);
  const { items: habits } = useHabitsForDay(today);
  const toggleHabit = useToggleHabit(today);

  const doneCount = tasks.filter((t) => t.done).length;
  const dayPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const habitsDone = habits.filter((h) => h.done).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ ...centered, paddingTop: insets.top + 8, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MenuIcon size={22} />
        <Text style={styles.wordmark}>{kk.app.name}</Text>
        <BellIcon size={22} />
      </View>

      <View style={styles.segWrap}>
        <CollapsibleSegments
          items={PERIODS}
          index={period}
          onChange={setPeriod}
          open={segOpen}
          onToggleOpen={() => setSegOpen((v) => !v)}
          maxWidth={250}
        />
      </View>

      {/* мотивация — мақсат емес нәрсе қара карточкада */}
      <DarkCard style={styles.motto} radius={R.cardXs}>
        <QuoteIcon size={18} color={C.accent2} />
        <Text style={styles.mottoLabel}>{kk.today.motto}</Text>
        <Text style={styles.mottoText}>{MOTTO}</Text>
      </DarkCard>

      {/* күн */}
      <View style={styles.dateRow}>
        <View>
          <Text style={styles.date}>{formatDayMonthWeekday(today)}</Text>
          <Text style={styles.dateSub}>
            {weekNumber(today)}-апта · {cap(monthsUpper[today.getMonth()]!)} · {today.getFullYear()}
          </Text>
        </View>
        {habitsDone > 0 && (
          <View style={styles.streak}>
            <StarIcon size={11} color={C.accentDeep} strokeWidth={2.4} />
            <Text style={styles.streakText}>{habitsDone}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : isError ? (
          <Card style={styles.pad}>
            <Text style={styles.errorText}>{kk.common.loadError}</Text>
          </Card>
        ) : tasks.length === 0 ? (
          <EmptyToday />
        ) : (
          <Card style={styles.pad}>
            <SectionLabel style={{ marginBottom: 10 }}>{kk.today.goalsCard}</SectionLabel>

            <View style={styles.ringRow}>
              <ProgressRing
                pct={dayPct}
                size={100}
                strokeWidth={10}
                label={kk.today.ringLabel}
                numberSize={22}
              />
              <View style={styles.levels}>
                {(bars ?? []).length === 0 ? (
                  <Text style={styles.levelsEmpty}>
                    Апта, ай және жыл мақсаттарын қосқанда осында пайыз шығады.
                  </Text>
                ) : (
                  (bars ?? []).map((lv) => (
                    <View key={lv.id} style={{ gap: 4 }}>
                      <View style={styles.levelHead}>
                        <View style={styles.levelName}>
                          <View style={[styles.dot, { backgroundColor: lv.color }]} />
                          <Text style={styles.levelText} numberOfLines={1}>{lv.name}</Text>
                        </View>
                        <Text style={styles.levelPct}>{lv.pct}%</Text>
                      </View>
                      <ProgressBar pct={lv.pct} color={lv.color} height={4} />
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {tasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  time: task.time,
                  done: task.done,
                  goal: task.goal ?? { id: '', title: '—', color: C.accent },
                }}
                onToggle={(id) => toggleTask.mutate({ id, done: !task.done })}
                last={i === tasks.length - 1}
              />
            ))}
          </Card>
        )}

        {/* ӘДЕТТЕР — әдейі бөлек, пайызға кірмейді */}
        <DashedCard style={styles.padSm}>
          <View style={styles.habHead}>
            <View style={styles.habTitle}>
              <SectionLabel>{kk.today.habits}</SectionLabel>
              <Chip label={kk.today.habitsExcluded} tone="flat" size="sm" />
            </View>
            {habits.length > 0 && (
              <Text style={styles.habCount}>
                {habitsDone}/{habits.length}
              </Text>
            )}
          </View>

          {habits.length === 0 ? (
            <Text style={styles.habEmpty}>
              Әдет қосылмаған. Әдет — жететін нәтиже емес, күнделікті рефлекс.
            </Text>
          ) : (
            <View style={styles.habRow}>
              {habits.map((h) => (
                <View key={h.id} style={styles.habCol}>
                  <HabitCell
                    done={h.done}
                    planned={h.planned}
                    color={h.color}
                    onToggle={() => toggleHabit.mutate({ habitId: h.id, done: !h.done })}
                  />
                  <Text
                    style={[styles.habLabel, h.done && { color: C.accentDeep }]}
                    numberOfLines={1}
                  >
                    {h.title}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </DashedCard>
      </View>
    </ScrollView>
  );
}

/** Дерекқор бос кезде — не істеу керегін айтады, бос экран көрсетпейді */
function EmptyToday() {
  return (
    <Card style={styles.pad}>
      <SectionLabel>Бүгінге тапсырма жоқ</SectionLabel>
      <Text style={styles.emptyTitle}>Бірінші мақсатыңызды қосыңыз</Text>
      <Text style={styles.emptyText}>
        Жылдық мақсат құрғанда жүйе оны айға, аптаға және күнге өзі бөледі.
        Сонда бүгінгі бір белгі жылдық санды да жылжытады.
      </Text>
      <View style={styles.emptyHint}>
        <Text style={styles.emptyHintText}>
          Төмендегі ◆ түймесін басыңыз — «Жаңа мақсат» ашылады.
        </Text>
      </View>
    </Card>
  );
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 6,
  },
  wordmark: { fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink },
  segWrap: { paddingHorizontal: gutter, paddingTop: 4 },

  motto: { marginHorizontal: gutter, marginTop: 10, padding: 16 },
  mottoLabel: {
    fontFamily: font.bold, fontSize: 9, letterSpacing: 1.44,
    color: C.accent2, marginTop: 8,
  },
  mottoText: {
    fontFamily: font.title, fontSize: 14, lineHeight: 20,
    color: '#FFFFFF', marginTop: 6,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingTop: 14,
    paddingBottom: 10,
  },
  date: { fontFamily: font.bold, fontSize: 18, letterSpacing: -0.36, color: C.ink },
  dateSub: { fontFamily: font.prose, fontSize: 11, color: C.inkMuted, marginTop: 1 },
  streak: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.tintChip, borderRadius: R.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  streakText: { fontFamily: font.bold, fontSize: 11.5, color: C.accentDeep },

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  padSm: { padding: 15 },
  center: { paddingVertical: 40, alignItems: 'center' },
  errorText: { fontFamily: font.prose, fontSize: 13, color: C.inkProse },

  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  levels: { flexGrow: 1, flexShrink: 1, gap: 9 },
  levelsEmpty: { fontFamily: font.prose, fontSize: 11.5, lineHeight: 17, color: C.ink4 },
  levelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  levelName: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 999, flexShrink: 0 },
  levelText: { fontFamily: font.body, fontSize: 11.5, color: C.inkBody, flexShrink: 1 },
  levelPct: { fontFamily: font.bold, fontSize: 11.5, color: C.ink },

  divider: { height: 1, backgroundColor: C.lineSoft, marginTop: 12, marginBottom: 2 },

  emptyTitle: { fontFamily: font.bold, fontSize: 17, letterSpacing: -0.34, color: C.ink, marginTop: 8 },
  emptyText: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.inkProse, marginTop: 8 },
  emptyHint: {
    backgroundColor: C.tintSoft, borderWidth: 1, borderColor: C.tintLine,
    borderRadius: R.sm, paddingHorizontal: 13, paddingVertical: 11, marginTop: 14,
  },
  emptyHintText: { fontFamily: font.title, fontSize: 12, color: C.accentDeep },

  habHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  habTitle: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  habCount: { fontFamily: font.bold, fontSize: 11, color: C.accent },
  habEmpty: { fontFamily: font.prose, fontSize: 11.5, lineHeight: 17, color: C.ink4, marginTop: 10 },
  habRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  habCol: { flexGrow: 1, flexShrink: 1, alignItems: 'center', gap: 5 },
  habLabel: { fontFamily: font.bold, fontSize: 8, color: C.inkFaint },
});
