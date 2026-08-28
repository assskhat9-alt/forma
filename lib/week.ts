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

/** Қанша аптаның серпіні көрсетіледі */
const TREND_WEEKS = 5;

export type WeekAction = {
  id: string;
  title: string;
  date: string;
  goal: { title: string; color: string } | null;
};

export type WeekTrend = { key: string; pct: number; current: boolean };

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

export function useWeekSummary(weekStart: Date, now: Date) {
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

  const toAction = (g: Goal): WeekAction => ({
    id: g.id,
    title: g.title,
    date: g.period_start,
    goal: rootOf(g),
  });

  const pct = pctOf(week);
  const prevPct = pctOf(prev);

  return {
    isLoading,
    from,
    to: addDays(to, -1),
    total: week.length,
    done: done.length,
    missed: missed.map(toAction),
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

// ─────────────────────────────────────────────────────────────────────
// Қалып қойған әрекетті не істейміз
// ─────────────────────────────────────────────────────────────────────

/**
 * Әрекетті басқа күнге көшіру.
 *
 * ⚠ Ай да ауысады: жаңа күн басқа айға түссе, әрекет сол айдың астына
 * барады. Әйтпесе тамыздың әрекеті қыркүйекте тұрып, айлық пайызды
 * бұрмалар еді.
 */
export function useMoveAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, date, rootId }: { id: string; date: Date; rootId: string | null }) => {
      const iso = toISODate(date);
      let parentId: string | null = null;

      if (rootId) {
        const { data: month, error: e1 } = await supabase.rpc('month_for_date', {
          p_goal_id: rootId,
          p_date: iso,
        });
        if (e1) throw e1;
        if (!month) throw new Error('Жаңа күн мақсаттың мерзімінен тыс.');
        parentId = month as string;
      }

      const { error } = await supabase
        .from('goals')
        .update(
          parentId
            ? { period_start: iso, period_end: iso, parent_id: parentId }
            : { period_start: iso, period_end: iso },
        )
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

/**
 * Әрекетті жабу.
 *
 * ⚠ Жойылмайды, `dropped` болады: пайыз есебінен шығады, бірақ
 * «мынаны жоспарлағанмын, істемедім» деген факт сақталады.
 */
export function useDropAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'dropped' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

/** Әрекеттің тамырдағы жылдық мақсатының id-і — көшіргенде ай іздеу үшін */
export function useRootIdOf() {
  const { data: goals } = useGoals();
  const byId = new Map((goals ?? []).map((g) => [g.id, g]));

  return (actionId: string): string | null => {
    let cur = byId.get(actionId);
    const seen = new Set<string>();
    while (cur?.parent_id && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_id);
    }
    // Тамыры өзі болса — бұл жеке шаруа, айға тіркелмейді
    return cur && cur.id !== actionId ? cur.id : null;
  };
}
