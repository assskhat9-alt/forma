/**
 * Рефлексия және КАСКАДТЫҚ ӘСЕР.
 *
 * CLAUDE.md §7.4 — жеңілдетуге болмайтын өзара әрекет:
 * бір тапсырманы бітіргенде ол қай мақсатты неше пайызға жылжытқанын
 * көрсету керек. Бұл — қосымшаның ең мотивациялық тұсы.
 *
 * Есеп қарапайым, өйткені пайыз әрекет САНЫМЕН есептеледі:
 *   болды  = орындалғаны / барлығы × 100
 *   болған = (орындалғаны − 1) / барлығы × 100
 *   өсім   = 100 / барлығы
 *
 * Сондықтан «+25, +12, +4, +1» деген сандар ойдан шықпайды — олар
 * әр деңгейде бір әрекеттің нақты үлесі.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import { qk } from './query';
import { toISODate } from './calendar';
import { useGoals } from './goals';
import { kk } from '../i18n/kk';
import type { Goal } from './database.types';

export type ImpactRow = {
  /** «Күн» · «35-апта» · «Тамыз 2026» · мақсаттың аты */
  label: string;
  /** Осы әрекетке дейінгі пайыз */
  from: number;
  /** Осы әрекеттен кейінгі пайыз */
  to: number;
  /** Айырма — дәл осы әрекеттің үлесі */
  gain: number;
};

/** Түйіннен тамырға дейінгі тізбек: апта → ай → жыл */
function ancestorsOf(task: Goal, byId: Map<string, Goal>): Goal[] {
  const chain: Goal[] = [];
  const seen = new Set<string>([task.id]);
  let cur = task;

  while (cur.parent_id && !seen.has(cur.parent_id)) {
    const parent = byId.get(cur.parent_id);
    if (!parent) break;
    seen.add(parent.id);
    chain.push(parent);
    cur = parent;
  }
  return chain;
}

/**
 * Бір әрекеттің каскадтағы әсері.
 *
 * «Күн» жолы клиентте есептеледі: ол сақталған түйін емес, тек сол
 * күнге жоспарланған әрекеттердің тобы.
 */
export function useImpact(taskId: string | null) {
  const { data: goals } = useGoals();
  const byId = new Map((goals ?? []).map((g) => [g.id, g]));
  const task = taskId ? byId.get(taskId) ?? null : null;

  const chain = task ? ancestorsOf(task, byId) : [];
  const ids = chain.map((g) => g.id).join(',');

  // Сол күнге жоспарланған барлық әрекет — «Күн» жолы үшін
  const sameDay = task
    ? (goals ?? []).filter(
        (g) =>
          g.level === 'day' &&
          g.period_start === task.period_start &&
          g.status !== 'dropped',
      )
    : [];

  return useQuery({
    queryKey: ['impact', taskId ?? 'none', ids],
    enabled: !!task,
    queryFn: async (): Promise<ImpactRow[]> => {
      const rows: ImpactRow[] = [];

      // ── Күн ──
      if (sameDay.length > 0) {
        const done = sameDay.filter((g) => g.status === 'done').length;
        const total = sameDay.length;
        rows.push(makeRow(kk.period.day.charAt(0) + kk.period.day.slice(1).toLowerCase(), done, total));
      }

      // ── Апта → Ай → Жыл ──
      for (const node of chain) {
        const { data, error } = await supabase.rpc('action_counts', { p_goal_id: node.id });
        if (error) throw error;
        const c = (Array.isArray(data) ? data[0] : data) as
          | { total: number; done: number }
          | null;
        if (!c || c.total === 0) continue;
        rows.push(makeRow(node.title, c.done, c.total));
      }

      return rows;
    },
  });
}

function makeRow(label: string, done: number, total: number): ImpactRow {
  const to = Math.round((done / total) * 100);
  const from = Math.round((Math.max(done - 1, 0) / total) * 100);
  return { label, from, to, gain: to - from };
}

// ─────────────────────────────────────────────────────────────────────
// Сақтау
// ─────────────────────────────────────────────────────────────────────

export type NewReflection = {
  /**
   * Қай әрекетке жазылды. null — апта қорытындысы сияқты, бір
   * әрекетке емес, кезеңге жазылған ой.
   */
  goalId: string | null;
  body: string | null;
  /** 1=Қиын 2=Орташа 3=Жақсы 4=Керемет */
  rating: number | null;
  /**
   * ⚠ §7.5 — таймерді ұмытып кетсе де фокус деректері жиналуы үшін.
   * Макетте бұл өріс жоқ еді, аудитте олқылық ретінде белгіленген.
   */
  minutesSpent: number | null;
};

export function useCreateReflection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (r: NewReflection) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { error } = await supabase.from('reflections').insert({
        user_id: userId,
        goal_id: r.goalId,
        body: r.body,
        rating: r.rating,
        minutes_spent: r.minutesSpent,
      });
      if (error) throw error;
    },
    onSuccess: (_d, r) => {
      if (r.goalId) qc.invalidateQueries({ queryKey: qk.reflections.byGoal(r.goalId) });
    },
  });
}

/** «30 мин» · «1 сағат» · «2 сағат» · «Өзім жазамын» → минут */
export const DURATION_MINUTES: (number | null)[] = [30, 60, 120, null];

/**
 * Осы әрекетке таймермен жазылған жалпы уақыт.
 *
 * Бір әрекет бірнеше отырыста істелуі мүмкін: «Уақытты сақтау» әр
 * жолы бөлек сессия жазады. Нәтижеде солардың ҚОСЫНДЫСЫ тұруы керек,
 * соңғы отырыс емес.
 */
export function useTaskFocusMinutes(goalId: string | null) {
  return useQuery({
    queryKey: ['focusForGoal', goalId],
    enabled: !!goalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('minutes')
        .eq('goal_id', goalId!);
      if (error) throw error;
      return (data ?? []).reduce((a, s) => a + (s.minutes ?? 0), 0);
    },
  });
}

/** 47 → «47 мин», 75 → «1 сағ 15 мин» */
export function humanMinutes(n: number): string {
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} сағ`;
  return `${h} сағ ${m} мин`;
}

/** Бүгінгі күннің `HH:MM` пішіміндегі уақыты */
export function nowTime(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export { toISODate };
