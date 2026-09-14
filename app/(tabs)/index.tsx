/**
 * БАСТЫ БЕТ — Dropify стиліндегі заманауи басқару тақтасы (Dashboard).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { startOfWeek, addDays, isSameDay } from 'date-fns';

import { color as C, radius as R, font, gutter, dashboardCentered } from '../../theme/tokens';
import { kk, monthsUpper, weekdaysShort, t as tpl } from '../../i18n/kk';
import { useI18n } from '../../i18n/context';
import { useBreakpoint } from '../../lib/breakpoints';
import {
  useDayTasks, useToggleTask, useTodayLevels, useLoadOf, useYearGoalsWithStats,
} from '../../lib/goals';
import { useHabitsForDay, useToggleHabit } from '../../lib/habits';
import { useActiveMotto } from '../../lib/mottos';
import { useTimeOverview } from '../../lib/report';
import { useAdminAnnouncement } from '../../lib/admin';
import { useSession } from '../../lib/auth';
import { TopBar } from '../../components/layout/TopBar';
import {
  StatCard, RingCard, GoalStatusCard, TaskDetailsCard,
  MapOverviewCard, FocusFeatureCard, TodayTasksSection,
  type Stat,
} from '../../components/home';
import { CheckIcon, ClockIcon, DiamondIcon, BellIcon } from '../../components/icons';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const bp = useBreakpoint();
  const wide = bp !== 'phone';

  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState(today);

  const { session } = useSession();
  const { strings: S, isKk } = useI18n();
  const userName =
    session?.user?.user_metadata?.full_name ||
    (session?.user?.email?.split('@')[0] ?? (isKk ? 'Қолданушы' : 'Пользователь'));
  const { tasks, isLoading, isError } = useDayTasks(selected);
  const toggleTask = useToggleTask();
  const { data: yearGoals } = useYearGoalsWithStats(today);
  const timeRep = useTimeOverview(today);
  const { data: announcement } = useAdminAnnouncement();
  const { items: habits } = useHabitsForDay(selected);
  const toggleHabit = useToggleHabit(selected);

  const done = tasks.filter((t) => t.done).length;
  const left = tasks.length - done;
  const dayPct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const scored = (yearGoals ?? []).filter((g) => g.total > 0);
  const yearPct = scored.length
    ? Math.round(scored.reduce((a, g) => a + g.actual, 0) / scored.length)
    : 0;

  const topGoal = yearGoals && yearGoals.length > 0 ? yearGoals[0] : null;

  const stats: Stat[] = [
    {
      label: isKk ? 'Осы айдағы тапсырмалар' : 'Задачи на этот месяц',
      value: String(tasks.length),
      icon: CheckIcon,
      chartType: 'bars',
      empty: tasks.length === 0,
      note: tasks.length
        ? `${done} / ${tasks.length} ${isKk ? 'орындалды' : 'выполнено'}`
        : (isKk ? 'Тапсырмалар қосылмаған' : 'Задач пока нет'),
      href: '/calendar',
    },
    {
      label: isKk ? 'Фокус уақыты' : 'Время фокуса',
      value: `${timeRep.total} мин`,
      icon: ClockIcon,
      chartType: 'equalizer',
      empty: timeRep.total === 0,
      note: isKk ? 'Бүгінгі фокус' : 'Фокус сегодня',
      href: '/focus',
    },
    {
      label: isKk ? 'Жалпы прогресс' : 'Общий прогресс',
      value: `${dayPct}%`,
      icon: DiamondIcon,
      chartType: 'line',
      empty: dayPct === 0,
      note: tasks.length > 0 ? (isKk ? 'Күндік қарқын' : 'Дневной темп') : (isKk ? 'Әрекет қосылмаған' : 'Нет действий'),
      href: '/goals',
    },
  ];

  const toggle = (id: string, wasDone: boolean) => {
    const next = !wasDone;
    toggleTask.mutate({ id, done: next });
    if (next) router.push(`/reflection?taskId=${id}` as never);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        dashboardCentered,
        { paddingTop: insets.top + 10, paddingBottom: 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Жоғарғы басқару жолағы (Welcome back + + Жаңа мақсат) ── */}
      <TopBar
        subtitle={
          tasks.length > 0
            ? isKk
              ? `Бүгінге ${tasks.length} тапсырма дайын (${done} орындалды).`
              : `На сегодня ${tasks.length} задач готово (${done} выполнено).`
            : undefined
        }
        primaryAction={{
          label: isKk ? '+ Жаңа мақсат' : '+ Новая цель',
          onPress: () => router.push('/goal/new' as never),
        }}
      />

      <View style={styles.body}>
        {announcement?.enabled && Boolean(announcement.text) && (
          <View style={styles.announcementBanner}>
            <BellIcon size={16} color={C.accent} />
            <Text style={styles.announcementText}>{announcement.text}</Text>
          </View>
        )}

        {/* ── 1. Жоғарғы 3 статистика карточкасы (Dropify стилі) ── */}
        <View style={styles.statGrid}>
          {stats.map((s) => (
            <StatCard
              key={s.label}
              stat={s}
              onPress={s.href ? () => router.navigate(s.href as never) : undefined}
            />
          ))}
        </View>

        {/* ── 2. Негізгі 3 бағанды макет (Dropify Grid) ── */}
        <View style={[styles.mainGrid, !wide && styles.mainGridMobile]}>
          {/* Сол жақ баған: Тапсырма мәліметі + Спидометр қарқын сақинасы */}
          <View style={[styles.col, styles.colLeft]}>
            <TaskDetailsCard
              title={isKk ? 'Тапсырмалар мәліметі' : 'Детали задач'}
              subtitle={isKk ? 'Бүгін орындалуда' : 'В процессе'}
              doneCount={done}
              leftCount={left}
              habitCount={habits.length}
              userName={userName}
              onAction={() => router.navigate('/notes' as never)}
            />

            <RingCard
              title={isKk ? 'Күндік қарқын' : 'Дневной темп'}
              caption={tasks.length > 0 ? (isKk ? 'қарқын' : 'темп') : (isKk ? 'жоспар жоқ' : 'нет задач')}
              pct={dayPct}
              unit="%"
              onPress={() => router.navigate('/goals' as never)}
            />
          </View>

          {/* Ортаңғы баған: Ағымдағы мақсат кезеңі + Басты назардағы жоба */}
          <View style={[styles.col, styles.colCenter]}>
            <GoalStatusCard
              title={isKk ? 'Ағымдағы кезең' : 'Текущий этап'}
              hasGoal={Boolean(topGoal)}
              code={topGoal ? `#${topGoal.goal.id.slice(0, 8).toUpperCase()}` : undefined}
              origin="2026 ЖЫЛ"
              destination={isKk ? 'МАҚСАТ' : 'ЦЕЛЬ'}
              pct={topGoal ? (topGoal.total > 0 ? Math.round((topGoal.actual / topGoal.total) * 100) : 0) : 0}
              onViewMore={() => router.navigate('/goals' as never)}
              onAddGoal={() => router.push('/goal/new' as never)}
            />

            <FocusFeatureCard
              title={topGoal ? topGoal.goal.title : (isKk ? 'Фокус орталығы' : 'Центр фокуса')}
              subtitle={
                topGoal
                  ? (isKk ? 'Басты назардағы мақсат' : 'Главный фокус')
                  : (isKk ? 'Таймерді қосып, өнімділікті арттырыңыз' : 'Запустите таймер для продуктивности')
              }
              spec1={{ val: `${timeRep.total} мин`, lbl: isKk ? 'Уақыт' : 'Время' }}
              spec2={{ val: `${dayPct}%`, lbl: isKk ? 'Орындалу' : 'Итог' }}
              spec3={{ val: `${tasks.length} іс`, lbl: isKk ? 'Тапсырма' : 'Задачи' }}
              onPress={() => router.navigate('/focus' as never)}
            />
          </View>

          {/* Оң жақ баған: Апталық бағыт картасы (Map Overview) */}
          <View style={[styles.col, styles.colRight]}>
            <MapOverviewCard
              title={isKk ? 'Апталық бағыт картасы' : 'Карта недели'}
              startName={isKk ? 'Дс (Бастау)' : 'Пн (Старт)'}
              endName={isKk ? 'Жс (Мәре)' : 'Вс (Финиш)'}
              progressMetric={`${dayPct}% / 100%`}
              pct={dayPct}
              onExpand={() => router.navigate('/calendar' as never)}
            />
          </View>
        </View>

        {/* ── 3. Тапсырмалар кестесі және әдеттер ── */}
        <TodayTasksSection
          selected={selected}
          tasks={tasks}
          habits={habits}
          isLoading={isLoading}
          isError={isError}
          wide={wide}
          onToggleTask={toggle}
          onToggleHabit={(id, val) => toggleHabit.mutate({ habitId: id, done: val })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  body: { paddingHorizontal: 22, gap: 16, marginTop: 4 },

  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.accentLine,
  },
  announcementText: {
    fontFamily: font.title,
    fontSize: 13,
    color: C.ink,
    flexShrink: 1,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  mainGrid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  mainGridMobile: {
    flexDirection: 'column',
  },

  col: {
    gap: 16,
  },
  colLeft: {
    flex: 3,
    minWidth: 260,
  },
  colCenter: {
    flex: 4,
    minWidth: 320,
  },
  colRight: {
    flex: 3,
    minWidth: 260,
  },
});
