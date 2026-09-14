/**
 * Апта қорытындысы.
 *
 * Аптаның не болғанын САНАЙДЫ, жоспар ҚҰРМАЙДЫ (CLAUDE.md §5.2a):
 * қалып қойған әрекетті келесі аптаға көшіру де, жабу да — адамның
 * шешімі. Жүйе тек «мынау қалып қойды» деп көрсетеді.
 *
 * ⚠ Бүгінгі күн «қалып қойды» болып саналмайды: күн әлі бітпеген.
 * Тек өткен күндердегі орындалмаған әрекет қалып қойған болып есептеледі.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import { qk } from './query';
import { toISODate } from './calendar';
import { useGoals, useRootGoals } from './goals';
import { useHabits, useHabitLogs, plannedOn } from './habits';
import { startOfDay, addDays, startOfWeek } from './report';
import { color as C } from '../theme/tokens';
import type { Goal, FocusSession } from './database.types';

export * from './weekLessons';
export * from './weekActions';

/** Қанша аптаның серпіні көрсетіледі */
const TREND_WEEKS = 5;

export type WeekAction = {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  status: 'done' | 'missed' | 'planned';
  goal: { title: string; color: string } | null;
};

export type WeekDayStats = {
  date: Date;
  iso: string;
  dayName: string;
  dayNum: number;
  total: number;
  done: number;
  pct: number;
  isToday: boolean;
};

export type WeekTrend = { key: string; pct: number; current: boolean };

export type WeekReport = {
  isLoading: boolean;
  from: Date;
  to: Date;
  total: number;
  done: number;
  missed: WeekAction[];
  doneActions: WeekAction[];
  allActions: WeekAction[];
  days: WeekDayStats[];
  ahead: number;
  pct: number;
  prevPct: number;
  delta: number | null;
  trend: WeekTrend[];
  focusMinutes: number;
  habitDone: number;
  habitPlanned: number;
  canGoNext: boolean;
};

/** Аптадағы әрекеттердің бөлінісі */
function split(goals: Goal[], from: Date, to: Date) {
  const a = toISODate(from);
  const b = toISODate(addDays(to, -1));

  return goals.filter(
    (g) =>
      g.level === 'day' &&
      g.status !== 'dropped' &&
      g.period_start >= a &&
      g.period_start <= b,
  );
}

function pctOf(rows: Goal[]): number {
  if (rows.length === 0) return 0;
  return Math.round((rows.filter((g) => g.status === 'done').length / rows.length) * 100);
}

export function useWeekSummary(weekStart: Date, now: Date): WeekReport {
  const from = startOfWeek(weekStart);
  const to = addDays(from, 7);
  const today = startOfDay(now);

  const { data: goals, isLoading } = useGoals();
  const rootGoals = useRootGoals();
  const all = goals ?? [];

  const byId = new Map(all.map((g) => [g.id, g]));
  const colorOf = new Map(rootGoals.map((g) => [g.id, g.color]));

  const rootOf = (g: Goal) => {
    let cur: Goal | undefined = g;
    const seen = new Set<string>();
    while (cur?.parent_id && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_id);
    }
    if (!cur || cur.id === g.id || !colorOf.has(cur.id)) return null;
    return { title: cur.title, color: colorOf.get(cur.id) ?? C.accent };
  };

  const week = split(all, from, to);
  const done = week.filter((g) => g.status === 'done');

  /**
   * ⚠ Тек ӨТКЕН күндер. Бүгін мен алдағы күндер «қалып қойды» емес:
   * оларға әлі уақыт бар.
   */
  const missed = week.filter(
    (g) =>
      g.status !== 'done' &&
      new Date(g.period_start + 'T00:00:00').getTime() < today.getTime(),
  );

  const ahead = week.length - done.length - missed.length;

  // ── Серпін: соңғы бірнеше апта ──
  const trend: WeekTrend[] = Array.from({ length: TREND_WEEKS }, (_, i) => {
    const s = addDays(from, (i - (TREND_WEEKS - 1)) * 7);
    const rows = split(all, s, addDays(s, 7));
    return {
      key: toISODate(s),
      pct: pctOf(rows),
      current: i === TREND_WEEKS - 1,
    };
  });

  const prev = split(all, addDays(from, -7), from);

  // ── Фокус уақыты ──
  const focus = useQuery({
    queryKey: ['weekFocus', from.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .gte('created_at', from.toISOString())
        .lt('created_at', to.toISOString());
      if (error) throw error;
      return (data ?? []) as FocusSession[];
    },
  });

  // ── Әдеттер ──
  const { data: habits } = useHabits();
  const { data: logs } = useHabitLogs(from, addDays(to, -1));
  const doneKeys = new Set((logs ?? []).map((l) => `${l.habit_id}|${l.log_date}`));

  let habitPlanned = 0;
  let habitDone = 0;
  for (const h of habits ?? []) {
    for (let i = 0; i < 7; i++) {
      const d = addDays(from, i);
      // Болашақ күнді жоспарға қоспаймыз — ол әлі өткізілген жоқ
      if (d.getTime() > today.getTime()) break;
      if (!plannedOn(h.schedule, d)) continue;
      habitPlanned += 1;
      if (doneKeys.has(`${h.id}|${toISODate(d)}`)) habitDone += 1;
    }
  }

  const DAY_NAMES = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жк'];
  const days: WeekDayStats[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(from, i);
    const iso = toISODate(d);
    const dayTasks = week.filter((g) => g.period_start === iso);
    const dayDone = dayTasks.filter((g) => g.status === 'done').length;
    return {
      date: d,
      iso,
      dayName: DAY_NAMES[i]!,
      dayNum: d.getDate(),
      total: dayTasks.length,
      done: dayDone,
      pct: dayTasks.length ? Math.round((dayDone / dayTasks.length) * 100) : 0,
      isToday: iso === toISODate(today),
    };
  });

  const toAction = (g: Goal): WeekAction => {
    const isDone = g.status === 'done';
    const isMissed = !isDone && new Date(g.period_start + 'T00:00:00').getTime() < today.getTime();
    return {
      id: g.id,
      title: g.title,
      date: g.period_start,
      time: g.scheduled_at ? g.scheduled_at.slice(11, 16) : null,
      status: isDone ? 'done' : isMissed ? 'missed' : 'planned',
      goal: rootOf(g),
    };
  };

  const pct = pctOf(week);
  const prevPct = pctOf(prev);

  return {
    isLoading,
    from,
    to: addDays(to, -1),
    total: week.length,
    done: done.length,
    missed: missed.map(toAction),
    doneActions: done.map(toAction),
    allActions: week.map(toAction),
    days,
    ahead,
    pct,
    prevPct,
    /** Салыстыруға өткен аптада әрекет болмаса — айырма көрсетілмейді */
    delta: prev.length > 0 ? pct - prevPct : null,
    trend,
    focusMinutes: (focus.data ?? []).reduce((a, r) => a + (r.minutes ?? 0), 0),
    habitDone,
    habitPlanned,
    /** Келесі аптаға өтуге бола ма — болашақтың қорытындысы жоқ */
    canGoNext: to.getTime() <= today.getTime(),
  };
}


