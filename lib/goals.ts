/**
 * Мақсаттар мен тапсырмалардың дерек қабаты.
 *
 * Барлық сұрау react-query арқылы (CLAUDE.md §9). Чекбокс басылғанда
 * optimistic update — желі жауабы күтілмейді.
 *
 * ⚠ Пайызды клиентте ҚАЙТА ЕСЕПТЕМЕЙМІЗ (§5.1). Деңгей пайыздары
 * `goal_stats()` RPC-інен келеді. Тек күндік сақина ғана клиентте
 * саналады — ол «бүгінгі тапсырмалардың нешеуі орындалды» дегенді
 * білдіреді, каскадтың бір бөлігі емес.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import { qk } from './query';
import { toISODate } from './calendar';
import { buildPlan, type Curve } from './plan';
import { monthsUpper } from '../i18n/kk';
import { color as C } from '../theme/tokens';
import type { Goal, GoalStats } from './database.types';

/** Тамырдағы жылдық мақсаттарға берілетін түс шкаласы */
const SHADES = [C.accent, C.accent2, C.accent3, C.accent4, C.accent5];

export type GoalRef = { id: string; title: string; color: string };

export type DayTask = {
  id: string;
  title: string;
  /** `HH:MM` немесе null — «уақытсыз» */
  time: string | null;
  goal: GoalRef | null;
  done: boolean;
};

export type DayLoad = {
  total: number;
  done: number;
  items: { title: string; color: string }[];
};

// ─────────────────────────────────────────────────────────────────────
// Барлық мақсат — бір сұрауда
// ─────────────────────────────────────────────────────────────────────
//
// Жеке қосымшада мақсат саны жүзден аспайды, сондықтан бәрін бір рет
// алып, ағашты клиентте құру серверге әр карточка үшін сұрау жіберуден
// әлдеқайда арзан.

async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('period_start', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useGoals() {
  return useQuery({ queryKey: qk.goals.all, queryFn: fetchGoals });
}

/** Тапсырманың тамырдағы жылдық мақсатын табады */
function rootOf(goal: Goal, byId: Map<string, Goal>): Goal {
  let cur = goal;
  const seen = new Set<string>();
  while (cur.parent_id && !seen.has(cur.id)) {
    seen.add(cur.id);
    const parent = byId.get(cur.parent_id);
    if (!parent) break;
    cur = parent;
  }
  return cur;
}

/** Тамырдағы мақсаттарға тұрақты түс береді — реті бойынша */
function colorMap(goals: Goal[]): Map<string, string> {
  const roots = goals
    .filter((g) => !g.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  const m = new Map<string, string>();
  roots.forEach((r, i) => m.set(r.id, SHADES[i % SHADES.length]!));
  return m;
}

/** `2026-08-25T08:00:00+05` → `08:00` */
function timeOf(g: Goal): string | null {
  if (!g.scheduled_at) return null;
  const d = new Date(g.scheduled_at);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Күндік тапсырмаларды дайын түрде қайтарады.
 * Барлық мақсат бір рет жүктелгендіктен қосымша сұрау жіберілмейді.
 */
export function useDayTasks(date: Date) {
  const { data: goals, ...rest } = useGoals();
  const iso = toISODate(date);

  const byId = new Map((goals ?? []).map((g) => [g.id, g]));
  const colors = colorMap(goals ?? []);

  const tasks: DayTask[] = (goals ?? [])
    .filter((g) => g.level === 'day' && g.period_start === iso && g.status !== 'dropped')
    .map((g) => {
      const root = rootOf(g, byId);
      return {
        id: g.id,
        title: g.title,
        time: timeOf(g),
        goal: root.id === g.id ? null : { id: root.id, title: root.title, color: colors.get(root.id) ?? C.accent },
        done: g.status === 'done',
      };
    })
    .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));

  return { tasks, goals: goals ?? [], ...rest };
}

/** Календарь ұяшығының жүктемесін есептейтін функция қайтарады */
export function useLoadOf() {
  const { data: goals } = useGoals();
  const byId = new Map((goals ?? []).map((g) => [g.id, g]));
  const colors = colorMap(goals ?? []);

  const byDate = new Map<string, DayLoad>();
  for (const g of goals ?? []) {
    if (g.level !== 'day' || g.status === 'dropped') continue;
    const root = rootOf(g, byId);
    const cur = byDate.get(g.period_start) ?? { total: 0, done: 0, items: [] };
    cur.total += 1;
    if (g.status === 'done') cur.done += 1;
    cur.items.push({ title: root.title, color: colors.get(root.id) ?? C.accent });
    byDate.set(g.period_start, cur);
  }

  return (d: Date) => byDate.get(toISODate(d)) ?? null;
}

/** Тамырдағы жылдық мақсаттар — «Қай мақсатқа жатады» тізімі үшін */
export function useRootGoals(): GoalRef[] {
  const { data: goals } = useGoals();
  const colors = colorMap(goals ?? []);
  return (goals ?? [])
    .filter((g) => !g.parent_id && g.status !== 'dropped')
    .map((g) => ({ id: g.id, title: g.title, color: colors.get(g.id) ?? C.accent }));
}

// ─────────────────────────────────────────────────────────────────────
// Мутациялар
// ─────────────────────────────────────────────────────────────────────

/** Чекбокс — optimistic update, желі жауабын күтпейді (§9) */
export function useToggleTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('goals')
        .update({
          status: done ? 'done' : 'active',
          completed_at: done ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },

    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: qk.goals.all });
      const prev = qc.getQueryData<Goal[]>(qk.goals.all);

      qc.setQueryData<Goal[]>(qk.goals.all, (old) =>
        (old ?? []).map((g) =>
          g.id === id ? { ...g, status: done ? 'done' : 'active' } : g,
        ),
      );

      return { prev };
    },

    onError: (_e, _v, ctx) => {
      // Желі құласа — бұрынғы күйге қайтарамыз
      if (ctx?.prev) qc.setQueryData(qk.goals.all, ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.goals.all });
    },
  });
}

export type NewGoal = {
  title: string;
  start: Date;
  end: Date;
  targetAmount: number | null;
  unit: string | null;
  curve: Curve;
};

/**
 * Жылдық мақсатты ЖӘНЕ оның айлық балаларын құрады.
 *
 * ⚠ Айлық балалар — сәндік емес. Дәл солардың `weight` мәні
 * planned_progress() есебінің негізі болады (CLAUDE.md §5.2).
 * Баласы жоқ мақсат сызықтық есепке түсіп қалады, ал ол — тыйым
 * салынған тәртіп.
 */
export function useCreateGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (g: NewGoal) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { data: parent, error: e1 } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          parent_id: null,
          level: 'year',
          title: g.title,
          period_start: toISODate(g.start),
          period_end: toISODate(g.end),
          target_amount: g.targetAmount,
          unit: g.unit,
        })
        .select('id')
        .single();
      if (e1) throw e1;

      const buckets = buildPlan(g.start, g.end, g.targetAmount ?? 100, g.curve);

      const children = buckets.map((b, i) => ({
        user_id: userId,
        parent_id: parent.id,
        level: 'month' as const,
        title: `${monthsUpper[b.monthIndex]!.charAt(0)}${monthsUpper[b.monthIndex]!.slice(1).toLowerCase()} ${b.year}`,
        period_start: toISODate(b.start),
        period_end: toISODate(b.end),
        weight: b.weight,
        target_amount: g.targetAmount == null ? null : b.amount,
        unit: g.unit,
        sort_order: i,
      }));

      if (children.length > 0) {
        const { error: e2 } = await supabase.from('goals').insert(children);
        if (e2) throw e2;
      }

      return parent.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

export type NewTask = {
  title: string;
  date: Date;
  /** `HH:MM` немесе null */
  time: string | null;
  parentId: string | null;
};

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (t: NewTask) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const iso = toISODate(t.date);
      let scheduled: string | null = null;
      if (t.time) {
        const [h, m] = t.time.split(':').map(Number);
        const dt = new Date(t.date);
        dt.setHours(h ?? 0, m ?? 0, 0, 0);
        scheduled = dt.toISOString();
      }

      const { error } = await supabase.from('goals').insert({
        user_id: userId,
        parent_id: t.parentId,
        level: 'day',
        title: t.title,
        period_start: iso,
        period_end: iso,
        scheduled_at: scheduled,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

// ─────────────────────────────────────────────────────────────────────
// Пайыздар — тек серверден
// ─────────────────────────────────────────────────────────────────────

export type LevelBar = {
  id: string;
  /** «Апта» · «Тамыз» · «2026 жыл» */
  name: string;
  pct: number;
  color: string;
};

/**
 * Бүгінгі күнді қамтитын апта, ай және жыл мақсаттарының пайызы.
 *
 * Үш RPC бір сұрауда — әр карточка үшін бөлек шақыру жіберілмейді.
 * Пайыз серверде есептеледі (§5.1).
 */
export function useLevelBars(date: Date) {
  const { data: goals } = useGoals();
  const iso = toISODate(date);

  // Бүгінді қамтитын әр деңгейден біреуі
  const covering = (level: Goal['level']) =>
    (goals ?? []).find(
      (g) => g.level === level && g.period_start <= iso && g.period_end >= iso && g.status !== 'dropped',
    ) ?? null;

  const week = covering('week');
  const month = covering('month');
  const year = covering('year');
  const ids = [week, month, year].filter(Boolean).map((g) => g!.id);

  const shades = [C.accent, C.accent3, C.accent5];

  return useQuery({
    queryKey: ['levelBars', iso, ids.join(',')],
    enabled: ids.length > 0,
    queryFn: async (): Promise<LevelBar[]> => {
      const rows = await Promise.all(
        [week, month, year].map(async (g, i) => {
          if (!g) return null;
          const { data, error } = await supabase.rpc('goal_stats', {
            p_goal_id: g.id,
            p_on_date: iso,
          });
          if (error) throw error;
          const stat = Array.isArray(data) ? data[0] : (data as GoalStats | null);
          return {
            id: g.id,
            name: g.title,
            pct: Math.round(stat?.actual ?? 0),
            color: shades[i]!,
          };
        }),
      );
      return rows.filter(Boolean) as LevelBar[];
    },
  });
}

export type GoalWithStats = {
  goal: Goal;
  color: string;
  actual: number;
  planned: number;
  gap: number;
};

/**
 * Жылдық мақсаттар және олардың пайызы.
 *
 * Пайыз goal_stats() RPC-інен келеді — клиентте есептелмейді (§5.1).
 * Жеке қосымшада жылдық мақсат саны онға жетпейді, сондықтан
 * әрқайсысына бір сұрау жіберу қалыпты.
 */
export function useYearGoalsWithStats(onDate: Date) {
  const { data: goals } = useGoals();
  const iso = toISODate(onDate);
  const colors = colorMap(goals ?? []);

  const years = (goals ?? []).filter(
    (g) => g.level === 'year' && g.status !== 'dropped',
  );
  const ids = years.map((g) => g.id).join(',');

  return useQuery({
    queryKey: ['yearGoals', iso, ids],
    enabled: years.length > 0,
    queryFn: async (): Promise<GoalWithStats[]> =>
      Promise.all(
        years.map(async (g) => {
          const { data, error } = await supabase.rpc('goal_stats', {
            p_goal_id: g.id,
            p_on_date: iso,
          });
          if (error) throw error;
          const s = Array.isArray(data) ? data[0] : (data as GoalStats | null);
          return {
            goal: g,
            color: colors.get(g.id) ?? C.accent,
            actual: Math.round(s?.actual ?? 0),
            planned: Math.round(s?.planned ?? 0),
            gap: Math.round(s?.gap ?? 0),
          };
        }),
      ),
  });
}

/** Ашылған мақсаттың айлық балалары мен олардың пайызы */
export function useChildStats(parentId: string | null, onDate: Date) {
  const { data: goals } = useGoals();
  const iso = toISODate(onDate);

  const children = (goals ?? [])
    .filter((g) => g.parent_id === parentId && g.status !== 'dropped')
    .sort((a, b) => a.period_start.localeCompare(b.period_start));

  return useQuery({
    queryKey: ['childStats', parentId ?? 'none', iso],
    enabled: !!parentId && children.length > 0,
    queryFn: async () =>
      Promise.all(
        children.map(async (g) => {
          const { data, error } = await supabase.rpc('progress', { p_goal_id: g.id });
          if (error) throw error;
          return { goal: g, pct: Math.round(Number(data) || 0) };
        }),
      ),
  });
}

/** goal_stats() RPC: нақты орындалу, «керек еді» және айырма */
export function useGoalStats(goalId: string | null, onDate?: Date) {
  const iso = onDate ? toISODate(onDate) : undefined;

  return useQuery({
    queryKey: qk.goals.progress(goalId ?? 'none'),
    enabled: !!goalId,
    queryFn: async (): Promise<GoalStats> => {
      const { data, error } = await supabase.rpc('goal_stats', {
        p_goal_id: goalId!,
        ...(iso ? { p_on_date: iso } : {}),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : (data as GoalStats | null);
      return row ?? { actual: 0, planned: 0, gap: 0 };
    },
  });
}
