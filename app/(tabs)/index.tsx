/**
 * БАСТЫ БЕТ — панель.
 *
 * Бұл экран каскадтың бір деңгейі емес, бүкіл жүйенің кіреберісі:
 * жоғарыда сандар қатары, ортасында апта серпіні мен деңгейлер,
 * төменде таңдалған күннің әрекеттері.
 *
 * Екі бөлек блок, шатастыруға болмайды (CLAUDE.md §1):
 *   ақ карточка  → мақсаттар. Пайыз ТЕК осыдан есептеледі.
 *   үзік сызықты → әдеттер. Пайызға МҮЛДЕ қосылмайды.
 *
 * ⚠ Панельдегі бірде-бір сан болжам емес. «Өткен аптадан +4%» деген
 * көрсеткіш әдейі ЖОҚ: ол үшін тарихи дерек керек, ал ол әлі жиналмаған.
 *
 * Блоктар `components/home/*` ішінде жеке тұрады да, бұл файл тек
 * деректі солардың пропына айналдырады — блокты ауыстыру, орнын
 * алмастыру немесе алып тастау осында бір жерден істеледі.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { startOfWeek, addDays, isSameDay } from 'date-fns';

import {
  color as C, radius as R, font, gutter, centered, dashboardCentered,
} from '../../theme/tokens';
import {
  kk, formatDayMonthWeekday, monthsUpper, weekdaysShort, t as tpl,
} from '../../i18n/kk';
import { weekNumber } from '../../lib/calendar';
import { useBreakpoint } from '../../lib/breakpoints';
import {
  useDayTasks, useToggleTask, useTodayLevels, useLoadOf, useYearGoalsWithStats,
} from '../../lib/goals';
import { useHabitsForDay, useToggleHabit } from '../../lib/habits';
import { useDueAction } from '../../lib/focus';
import { useActiveMotto } from '../../lib/mottos';
import { DueBanner } from '../../components/focus/DueBanner';
import {
  Card, DarkCard, DashedCard, SectionLabel, Chip, Checkbox,
} from '../../components/ui';
import {
  StatCard, WeekBars, WeekStrip, RingCard, TaskTable, LevelsCard, TimeCard,
  type Stat, type DayBar, type StripDay, type TableRow, type Level,
} from '../../components/home';
import { useTimeOverview } from '../../lib/report';
import { useAdminAnnouncement } from '../../lib/admin';
import { QuoteIcon, StarIcon, ChevronRightIcon, BellIcon } from '../../components/icons';
import { TopBar } from '../../components/layout/TopBar';
import { TaskRow } from '../../components/calendar/TaskRow';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const bp = useBreakpoint();
  const wide = bp !== 'phone';
  const tablet = bp === 'tablet';

  const today = useMemo(() => new Date(), []);
  /** Панель қай күнді көрсетіп тұр — апта жолағы мен кесте осыған қарайды */
  const [selected, setSelected] = useState(today);

  const { tasks, isLoading, isError } = useDayTasks(selected);
  const toggleTask = useToggleTask();
  const { data: bars } = useTodayLevels(selected);
  const { data: yearGoals } = useYearGoalsWithStats(today);
  const loadOf = useLoadOf();
  const timeRep = useTimeOverview(today);
  // Сөз базадан келеді — Мотивация экранында таңдалады
  const motto = useActiveMotto(today);
  const { data: announcement } = useAdminAnnouncement();
  const { items: habits } = useHabitsForDay(selected);
  const toggleHabit = useToggleHabit(selected);

  // ⚠ Тек ҰСЫНЫС: таймер өзі қосылмайды, шешімді адам қабылдайды
  const dueAction = useDueAction(today);

  const done = tasks.filter((t) => t.done).length;
  const dayPct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  // ⚠ Бүгінге жоспарланғаны ғана: аптасына үш рет жасалатын әдет
  // қалған күндері тізімде тұрмауы керек — ол өткізіліп жатқан жоқ
  const todayHabits = habits.filter((h) => h.planned);
  const habitsDone = todayHabits.filter((h) => h.done).length;

  // ── Апта: дүйсенбіден басталады ──────────────────────────────────
  const weekStart = startOfWeek(selected, { weekStartsOn: 1 });

  const weekDays: DayBar[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const load = loadOf(date);
    return {
      date,
      short: weekdaysShort[i]!,
      total: load?.total ?? 0,
      done: load?.done ?? 0,
      today: isSameDay(date, today),
    };
  });

  const stripDays: StripDay[] = weekDays.map((d) => ({ date: d.date, short: d.short }));

  // ── Жоғарғы сандар ───────────────────────────────────────────────
  const left = tasks.length - done;
  const activeGoals = (yearGoals ?? []).length;
  const scored = (yearGoals ?? []).filter((g) => g.total > 0);
  const yearPct = scored.length
    ? Math.round(scored.reduce((a, g) => a + g.actual, 0) / scored.length)
    : 0;

  const stats: Stat[] = [
    {
      label: kk.home.statDay,
      value: `${dayPct}%`,
      note: tasks.length
        ? tpl(kk.home.doneOfTotal, { done, total: tasks.length })
        : kk.home.nothingPlanned,
    },
    {
      label: kk.home.statActions,
      value: tasks.length ? `${done} / ${tasks.length}` : '—',
      note: !tasks.length
        ? kk.home.nothingPlanned
        : left > 0
          ? tpl(kk.home.leftN, { n: left })
          : kk.home.allDone,
    },
    {
      label: kk.home.statHabits,
      value: habits.length ? `${habitsDone} / ${habits.length}` : '—',
      note: kk.today.habitsExcluded,
    },
    {
      label: kk.home.statGoals,
      value: String(activeGoals),
      note: kk.home.goalsActive,
      href: '/goals',
    },
  ];

  const levels: Level[] = (bars ?? []).map((lv) => ({
    id: lv.goal.id,
    title: lv.goal.title,
    pct: lv.actual,
    color: lv.color,
  }));

  const rows: TableRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    time: t.time,
    done: t.done,
    // Мақсатқа тіркелмеген іс — бос тұрмасын, солай деп аталсын
    goal: t.goal ?? { title: kk.calendar.noGoal, color: C.ink4 },
  }));

  /** §7.4: рефлексия белгі ҚОЙЫЛҒАНДА ашылады, алынғанда емес */
  const toggle = (id: string, wasDone: boolean) => {
    const next = !wasDone;
    toggleTask.mutate({ id, done: next });
    if (next) router.push(`/reflection?taskId=${id}` as never);
  };

  const stripTitle = `${cap(monthsUpper[selected.getMonth()]!)} ${selected.getFullYear()}`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...(wide ? dashboardCentered : centered),
        paddingTop: insets.top + 8,
        paddingBottom: 32,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      // ⚠ Сан пернетақтасында «Дайын» түймесі жоқ — тізімді сүйреп жабады
      keyboardDismissMode="on-drag"
    >
      {wide ? (
        <TopBar title={kk.nav.home} />
      ) : (
        // ⚠ ☰ мен 🔔 алынды: екеуі де жай сурет болатын, басуға
        // келмейтін. Телефондағы навигация — төменгі жолақ.
        <View style={styles.header}>
          <Text style={styles.wordmark}>{kk.app.name}</Text>
        </View>
      )}

      <View style={[styles.body, wide && styles.bodyWide, tablet && styles.bodyTablet]}>
        {announcement?.enabled && Boolean(announcement.text) && (
          <View style={styles.announcementBanner}>
            <BellIcon size={16} color={C.accent} />
            <Text style={styles.announcementText}>{announcement.text}</Text>
          </View>
        )}

        {/* ── 1. Сандар қатары ── */}
        <View style={styles.statRow}>
          {stats.map((s, i) => (
            <StatCard
              key={s.label}
              stat={s}
              hero={i === 0}
              onPress={s.href ? () => router.navigate(s.href as never) : undefined}
            />
          ))}
        </View>

        {/*
          Телефонда үшінші баған жоқ: шаршы сандар қатарының дәл
          астында тұрады. Әйтпесе ол ең төменде қалып қояды да,
          көрінбейді.
        */}
        {!wide && (
          <TimeCard
            total={timeRep.total}
            goals={timeRep.goals}
            onPress={() => router.navigate('/time' as never)}
            compact={tablet}
          />
        )}

        {/* ── 2. Апта серпіні + оң баған ── */}
        <View style={[styles.mid, wide && styles.midWide, tablet && styles.midTablet]}>
          <WeekBars
            title={kk.home.weekTrend}
            days={weekDays}
            onPickDay={setSelected}
            onOpen={() => router.navigate('/week' as never)}
          />

          <View style={[styles.side, wide && styles.sideWide, tablet && styles.sideTablet]}>
            <WeekStrip
              title={stripTitle}
              days={stripDays}
              selected={selected}
              onSelect={setSelected}
              onPrev={() => setSelected((d) => addDays(d, -7))}
              onNext={() => setSelected((d) => addDays(d, 7))}
            />

            <RingCard
              title={kk.home.yearRing}
              caption={
                scored.length
                  ? tpl(kk.home.yearRingCaption, { n: scored.length })
                  : kk.home.yearRingEmpty
              }
              pct={yearPct}
              onPress={() => router.navigate('/goals' as never)}
            />

            <LevelsCard
              title={kk.home.levels}
              levels={levels}
              emptyText={kk.home.levelsEmpty}
            />
          </View>

          {/*
            Үшінші баған — мақсаттарға кеткен жалпы уақыт.
            Апта серпіні мен деңгейлерден бөлек тұрады: бұл күндік
            көрсеткіш емес, жиналып отыратын еңбек.
          */}
          {wide && (
            <View style={[styles.timeColWide, tablet && styles.timeColTablet]}>
              <TimeCard
                total={timeRep.total}
                goals={timeRep.goals}
                onPress={() => router.navigate('/time' as never)}
                compact={tablet}
              />
            </View>
          )}
        </View>

        {/*
          Мотивация — мақсат емес нәрсе қара карточкада.
          Сөз таңдалмаса блок мүлде шықпайды: жүйе өз сөзін ойлап таппайды.
        */}
        {motto && (
          <Pressable
            onPress={() => router.navigate('/motivation' as never)}
            accessibilityRole="link"
          >
            <DarkCard style={styles.motto} radius={R.cardXs}>
              <QuoteIcon size={18} color={C.accent2} />
              <Text style={styles.mottoLabel}>{kk.today.motto}</Text>
              <Text style={styles.mottoText}>{motto.text}</Text>
            </DarkCard>
          </Pressable>
        )}

        {/* Уақыты келген әрекет — ұсыныс, автоматты қосылу емес */}
        {dueAction && <DueBanner action={dueAction} />}

        {/* ── 3. Таңдалған күннің әрекеттері ── */}
        <View style={styles.dateRow}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.date}>{formatDayMonthWeekday(selected)}</Text>
            <Text style={styles.dateSub}>
              {weekNumber(selected)}-апта · {cap(monthsUpper[selected.getMonth()]!)} ·{' '}
              {selected.getFullYear()}
            </Text>
          </View>
          {habitsDone > 0 && (
            <View style={styles.streak}>
              <StarIcon size={11} color={C.accentDeep} strokeWidth={2.4} />
              <Text style={styles.streakText}>{habitsDone}</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <Card style={styles.pad}>
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          </Card>
        ) : isError ? (
          <Card style={styles.pad}>
            <Text style={styles.errorText}>{kk.common.loadError}</Text>
          </Card>
        ) : wide ? (
          <TaskTable
            title={kk.home.table}
            rows={rows}
            columns={[kk.home.colAction, kk.home.colGoal, kk.home.colTime, kk.home.colState]}
            emptyText={kk.home.tableEmpty}
            noTimeText={kk.home.noTime}
            doneText={kk.home.stateDone}
            openText={kk.home.stateOpen}
            onToggle={(r) => toggle(r.id, r.done)}
            onFocus={(r) => router.push(`/focus?taskId=${r.id}` as never)}
            right={
              <Pressable
                onPress={() => router.navigate('/calendar' as never)}
                style={styles.round}
                accessibilityRole="link"
                accessibilityLabel={kk.nav.calendar}
              >
                <ChevronRightIcon size={14} color={C.ink2} strokeWidth={2.4} />
              </Pressable>
            }
          />
        ) : tasks.length === 0 ? (
          <EmptyToday />
        ) : (
          <Card style={styles.pad}>
            <SectionLabel style={{ marginBottom: 6 }}>{kk.today.goalsCard}</SectionLabel>
            {tasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={(id) => toggle(id, task.done)}
                onFocus={(t) => router.push(`/focus?taskId=${t.id}` as never)}
                last={i === tasks.length - 1}
              />
            ))}
          </Card>
        )}

        {/* ── 4. ӘДЕТТЕР — әдейі бөлек, пайызға кірмейді ── */}
        <DashedCard style={styles.padSm}>
          <View style={styles.habHead}>
            <View style={styles.habTitle}>
              <SectionLabel>{kk.today.habits}</SectionLabel>
              <Chip label={kk.today.habitsExcluded} tone="flat" size="sm" />
            </View>
            <Pressable
              onPress={() => router.navigate('/habits' as never)}
              hitSlop={8}
              style={styles.habLink}
              accessibilityRole="link"
            >
              {todayHabits.length > 0 && (
                <Text style={styles.habCount}>
                  {habitsDone}/{todayHabits.length}
                </Text>
              )}
              <ChevronRightIcon size={12} color={C.accent} strokeWidth={2.6} />
            </Pressable>
          </View>

          {habits.length === 0 ? (
            <Text style={styles.habEmpty}>{kk.habits.emptyText}</Text>
          ) : todayHabits.length === 0 ? (
            <Text style={styles.habEmpty}>{kk.today.habitsNoneToday}</Text>
          ) : (
            <View style={styles.habList}>
              {todayHabits.map((h) => (
                <Pressable
                  key={h.id}
                  onPress={() => toggleHabit.mutate({ habitId: h.id, done: !h.done })}
                  style={styles.habItem}
                  accessibilityRole="button"
                  accessibilityState={{ checked: h.done }}
                  accessibilityLabel={h.title}
                >
                  <Checkbox
                    checked={h.done}
                    onToggle={() => toggleHabit.mutate({ habitId: h.id, done: !h.done })}
                    size={20}
                    activeColor={h.color}
                  />
                  <Text
                    style={[styles.habName, h.done && styles.habNameDone]}
                    numberOfLines={1}
                  >
                    {h.title}
                  </Text>
                </Pressable>
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
        Жылдық мақсат құрғанда жүйе айларды өзі ашады. Ішіндегі әрекетті
        сіз қоясыз — сонда бүгінгі бір белгі жылдық санды да жылжытады.
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
  header: { alignItems: 'center', paddingHorizontal: gutter, paddingBottom: 6 },
  wordmark: { fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink },

  body: { paddingHorizontal: gutter, gap: 10, marginTop: 10 },
  bodyWide: { paddingHorizontal: 26, gap: 14, marginTop: 0 },
  bodyTablet: { paddingHorizontal: 16, gap: 10 },

  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  mid: { gap: 10 },
  midWide: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  midTablet: { gap: 10 },
  side: { gap: 10 },
  sideWide: { width: 320, flexShrink: 0, gap: 14 },
  sideTablet: { width: 224, gap: 10 },
  timeColWide: { width: 300, flexShrink: 0 },
  timeColTablet: { width: 196 },

  motto: { padding: 16 },
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
    gap: 12,
    paddingTop: 4,
  },
  date: { fontFamily: font.bold, fontSize: 18, letterSpacing: -0.36, color: C.ink },
  dateSub: { fontFamily: font.prose, fontSize: 11, color: C.inkMuted, marginTop: 1 },
  streak: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.tintChip, borderRadius: R.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  streakText: { fontFamily: font.bold, fontSize: 11.5, color: C.accentDeep },

  pad: { padding: 17 },
  padSm: { padding: 15 },
  center: { paddingVertical: 30, alignItems: 'center' },
  errorText: { fontFamily: font.prose, fontSize: 13, color: C.inkProse },

  round: {
    width: 32, height: 32, borderRadius: R.pill,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },

  emptyTitle: { fontFamily: font.bold, fontSize: 17, letterSpacing: -0.34, color: C.ink, marginTop: 8 },
  emptyText: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.inkProse, marginTop: 8 },
  emptyHint: {
    backgroundColor: C.tintSoft, borderWidth: 1, borderColor: C.tintLine,
    borderRadius: R.sm, paddingHorizontal: 13, paddingVertical: 11, marginTop: 14,
  },
  emptyHintText: { fontFamily: font.title, fontSize: 12, color: C.accentDeep },

  habHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  habTitle: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  habLink: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  habCount: { fontFamily: font.bold, fontSize: 11, color: C.accent },
  habEmpty: { fontFamily: font.prose, fontSize: 11.5, lineHeight: 17, color: C.ink4, marginTop: 10 },
  habList: { marginTop: 6 },
  habItem: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 },
  habName: { fontFamily: font.title, fontSize: 13, color: C.ink, flexShrink: 1 },
  habNameDone: { color: C.inkFaint, textDecorationLine: 'line-through' },

  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.tintChip,
    borderRadius: R.cardXs,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.accentLine,
  },
  announcementText: {
    flex: 1,
    fontFamily: font.title,
    fontSize: 13,
    color: C.accent,
  },
});

