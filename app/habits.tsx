/**
 * ӘДЕТТЕР (design/Adetter.dc.html).
 *
 * ⚠ Бұл экрандағы ешбір сан мақсат пайызына қосылмайды (CLAUDE.md §5.1,
 * §7.2). Әдет — жететін нәтиже емес, қанға сіңетін күнделікті рефлекс.
 * Сондықтан ол мақсаттардан бөлек тұрады, өз экраны бар.
 *
 * Серия ЖОСПАРЛАНҒАН күндер бойынша саналады: аптасына үш рет жасалатын
 * әдет қалған төрт күні үзілді деп есептелмейді.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter, centered } from '../theme/tokens';
import { kk, monthsUpper, t as tpl } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useBreakpoint } from '../lib/breakpoints';
import {
  useHabitStats, useToggleHabit, useCreateHabit, useArchiveHabit,
} from '../lib/habits';
import { Card, DarkCard, SectionLabel, Fab } from '../components/ui';
import {
  ChevronLeftIcon, CloseIcon, CheckIcon, StarIcon,
} from '../components/icons';
import type { HabitSchedule } from '../lib/database.types';

/** Апта күндері — 1 = дүйсенбі (ISO) */
const DOW = [
  { iso: 1, short: 'Дс' },
  { iso: 2, short: 'Сс' },
  { iso: 3, short: 'Ср' },
  { iso: 4, short: 'Бс' },
  { iso: 5, short: 'Жм' },
  { iso: 6, short: 'Сн' },
  { iso: 7, short: 'Жк' },
];

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const today = new Date();

  const stats = useHabitStats(today);
  const toggle = useToggleHabit(today);
  const create = useCreateHabit();
  const archive = useArchiveHabit();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  /** Бос болса — күн сайын. Толса — тек таңдалған күндер */
  const [days, setDays] = useState<number[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    setNote(null);

    const schedule: HabitSchedule =
      days.length > 0 ? { type: 'weekly', days: [...days].sort() } : { type: 'daily' };

    create.mutate(
      { title: t, schedule, index: stats.items.length },
      {
        onSuccess: () => {
          setTitle('');
          setDays([]);
          setAdding(false);
        },
        onError: (e) => setNote(errorText(e)),
      },
    );
  };

  const monthName = monthsUpper[today.getMonth()]!;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          ...centered,
          paddingTop: insets.top + (wide ? 18 : 12),
          paddingBottom: insets.bottom + 96,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => goBack('/')} hitSlop={10} accessibilityRole="button">
            <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>{kk.habits.title}</Text>
          {/* ⚠ Қосу түймесі мұнда емес — төменде, саусақ жететін жерде */}
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.body}>
          {/*
            Серия бірінші тұрады: әдеттің мәні — үзілмеу.
            Қара карточка — «мұнда пайызға қатысты ештеңе жоқ» деген белгі.
          */}
          <DarkCard style={styles.hero}>
            <Text style={styles.heroLabel}>{kk.habits.longestStreak}</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroValue}>{stats.bestStreak}</Text>
              <Text style={styles.heroUnit}>{kk.habits.daysInRow}</Text>
            </View>

            <View style={styles.heroFoot}>
              <View>
                <Text style={styles.heroSmall}>{kk.habits.today}</Text>
                <Text style={styles.heroFig}>
                  {tpl(kk.habits.doneToday, {
                    done: stats.doneToday,
                    total: stats.plannedToday,
                  })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.heroSmall}>
                  {tpl(kk.habits.consistency, { month: monthName })}
                </Text>
                <Text style={styles.heroFig}>{stats.monthPct}%</Text>
              </View>
            </View>

            <Text style={styles.heroNote}>{kk.habits.explainer}</Text>
          </DarkCard>

          {/* ── Қосу бланкасы ── */}
          {adding && (
            <Card style={styles.pad}>
              <SectionLabel>{kk.habits.newHabit}</SectionLabel>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={kk.habits.placeholder}
                placeholderTextColor={C.ink4}
                style={styles.input}
                autoFocus
              />

              <SectionLabel style={{ marginTop: 15 }}>{kk.habits.when}</SectionLabel>
              <Text style={styles.whenHint}>{kk.habits.whenHint}</Text>

              <View style={styles.dowRow}>
                {DOW.map((d) => {
                  const on = days.includes(d.iso);
                  return (
                    <Pressable
                      key={d.iso}
                      onPress={() =>
                        setDays((v) =>
                          on ? v.filter((x) => x !== d.iso) : [...v, d.iso],
                        )
                      }
                      style={[styles.dow, on && styles.dowOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.dowText, on && { color: '#FFFFFF' }]}>
                        {d.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={submit}
                disabled={!title.trim() || create.isPending}
                style={[styles.submit, (!title.trim() || create.isPending) && { opacity: 0.45 }]}
                accessibilityRole="button"
              >
                {create.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>{kk.common.add}</Text>
                )}
              </Pressable>

              {note && <Text style={styles.error}>{note}</Text>}
            </Card>
          )}

          <SectionLabel style={{ paddingLeft: 4 }}>{kk.habits.mine}</SectionLabel>

          {stats.isLoading ? (
            <Card style={styles.pad}>
              <View style={styles.center}>
                <ActivityIndicator color={C.accent} />
              </View>
            </Card>
          ) : stats.items.length === 0 ? (
            <Card style={styles.pad}>
              <Text style={styles.emptyTitle}>{kk.habits.emptyTitle}</Text>
              <Text style={styles.emptyText}>{kk.habits.emptyText}</Text>
            </Card>
          ) : (
            stats.items.map((h) => (
              <Card key={h.id} level="cardSm" radius={R.cardSm} style={styles.habit}>
                <View style={styles.habitHead}>
                  <View style={[styles.dot, { backgroundColor: h.color }]} />
                  <Text style={styles.habitName} numberOfLines={1}>
                    {h.title}
                  </Text>

                  {h.streak > 0 && (
                    <View style={styles.streak}>
                      <StarIcon size={11} color={C.accentDeep} strokeWidth={2.4} />
                      <Text style={styles.streakText}>{h.streak}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => archive.mutate(h.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={kk.habits.archive}
                  >
                    <CloseIcon size={12} color={C.ink4} />
                  </Pressable>
                </View>

                <View style={styles.weekRow}>
                  <View style={styles.week}>
                    {h.week.map((d, i) => {
                      const last = i === h.week.length - 1;
                      return (
                        <Pressable
                          key={d.date.toISOString()}
                          // ⚠ Тек бүгінгі күнді ауыстыруға болады: өткенді
                          // қайта жазу әдет тарихын жалғанға айналдырады
                          onPress={
                            last
                              ? () => toggle.mutate({ habitId: h.id, done: !d.done })
                              : undefined
                          }
                          style={styles.day}
                          accessibilityRole={last ? 'button' : undefined}
                          accessibilityLabel={`${d.short}${d.done ? ' — орындалды' : ''}`}
                        >
                          <Text style={[styles.dayLabel, last && { color: C.accentDeep }]}>
                            {d.short}
                          </Text>
                          <View
                            style={[
                              styles.cell,
                              d.done && { backgroundColor: h.color, borderColor: h.color },
                              !d.done && d.planned && styles.cellPlanned,
                              !d.planned && styles.cellOff,
                            ]}
                          >
                            {d.done && <CheckIcon size={10} color="#FFFFFF" strokeWidth={4} />}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.pctBox}>
                    <Text style={styles.pct}>{h.pct}%</Text>
                    <Text style={styles.pctLabel}>{kk.habits.days30}</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <Fab
        label={adding ? kk.common.cancel : kk.habits.newHabit}
        active={adding}
        onPress={() => setAdding((v) => !v)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink,
  },

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  center: { paddingVertical: 26, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 12, color: C.inkProse, marginTop: 10 },

  hero: { padding: 18 },
  heroLabel: {
    fontFamily: font.bold, fontSize: 10, letterSpacing: 1.3,
    textTransform: 'uppercase', color: C.accent2,
  },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 7 },
  heroValue: {
    fontFamily: font.display, fontSize: 36, letterSpacing: -1.8, color: '#FFFFFF',
  },
  heroUnit: { fontFamily: font.title, fontSize: 12, color: C.darkInk2 },
  heroFoot: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', gap: 12, marginTop: 16,
  },
  heroSmall: {
    fontFamily: font.bold, fontSize: 9, letterSpacing: 1,
    textTransform: 'uppercase', color: C.darkInk3,
  },
  heroFig: { fontFamily: font.bold, fontSize: 14.5, color: '#FFFFFF', marginTop: 4 },
  heroNote: {
    fontFamily: font.prose, fontSize: 10.5, lineHeight: 16, color: C.darkInk2,
    borderTopWidth: 1, borderTopColor: C.darkLine, marginTop: 15, paddingTop: 12,
  },

  input: {
    borderWidth: 1.5, borderColor: C.lineField, borderRadius: R.sm,
    paddingHorizontal: 13, paddingVertical: 12, marginTop: 9,
    fontFamily: font.title, fontSize: 13.5, color: C.ink,
    outlineStyle: 'none' as never,
  },
  whenHint: { fontFamily: font.prose, fontSize: 11.5, color: C.ink4, marginTop: 6 },
  dowRow: { flexDirection: 'row', gap: 5, marginTop: 10 },
  dow: {
    flexGrow: 1, flexShrink: 1, alignItems: 'center', paddingVertical: 9,
    borderRadius: R.chipSm, backgroundColor: C.cardSoft,
    borderWidth: 1.5, borderColor: C.line,
  },
  dowOn: { backgroundColor: C.accent, borderColor: C.accent },
  dowText: { fontFamily: font.bold, fontSize: 11, color: C.inkMuted },

  submit: {
    marginTop: 15, height: 46, borderRadius: R.sm, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },

  emptyTitle: {
    fontFamily: font.bold, fontSize: 15, letterSpacing: -0.3, color: C.ink,
  },
  emptyText: {
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 19,
    color: C.inkProse, marginTop: 8,
  },

  habit: { paddingHorizontal: 15, paddingVertical: 14 },
  habitHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  dot: { width: 9, height: 9, borderRadius: 999, flexShrink: 0 },
  habitName: {
    fontFamily: font.bold, fontSize: 13, letterSpacing: -0.13,
    color: C.ink, flexGrow: 1, flexShrink: 1,
  },
  streak: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0,
  },
  streakText: { fontFamily: font.bold, fontSize: 11.5, color: C.accentDeep },

  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11 },
  week: { flexDirection: 'row', gap: 5, flexGrow: 1, flexShrink: 1 },
  day: { flexGrow: 1, flexShrink: 1, alignItems: 'center', gap: 4 },
  dayLabel: { fontFamily: font.bold, fontSize: 8.5, color: C.ink4 },
  cell: {
    width: '100%', height: 22, borderRadius: R.boxSm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardSoft, borderWidth: 1.5, borderColor: C.line,
  },
  /** Жоспарланған, бірақ әлі белгіленбеген күн */
  cellPlanned: { borderColor: C.tintLine, backgroundColor: C.tintSoft },
  /** Бұл күні жоспарланбаған — бос орын, «өткізіп алды» емес */
  cellOff: { backgroundColor: C.bg, borderColor: C.bg },

  pctBox: { width: 42, flexShrink: 0, alignItems: 'flex-end' },
  pct: { fontFamily: font.bold, fontSize: 13, color: C.ink },
  pctLabel: {
    fontFamily: font.bold, fontSize: 8, letterSpacing: 0.5, color: C.ink4, marginTop: 1,
  },
});
