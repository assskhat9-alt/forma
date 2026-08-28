/**
 * Мақсаттар мен әрекеттердің дерек қабаты.
 *
 * НЕГІЗГІ ҰСТАНЫМ:
 *   Автоматты болатыны — УАҚЫТ ҚАҢҚАСЫ (айлар, апталар).
 *   Қолмен болатыны   — оның ІШІНДЕГІ МАЗМҰН (әрекеттер).
 *
 * Жүйе жүктемені ешқашан өзі шешпейді. Айларды `sync_months()`,
 * апталарды `sync_weeks()` ашады — екеуі де Postgres жағында, сондықтан
 * қаңқа мен мерзім әрқашан сәйкес тұрады.
 *
 * ⚠ Пайызды клиентте ҚАЙТА ЕСЕПТЕМЕЙМІЗ. Ол `progress()` пен
 * `planned_progress()` RPC-інен келеді. Салмақ жоқ: пайыз әрекет
 * САНЫМЕН есептеледі, көп әрекет тұрған ай үлесті өзі көп алады.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import { qk } from './query';
import { toISODate } from './calendar';
import { color as C } from '../theme/tokens';
import type { Goal, GoalStats } from './database.types';

/** Жылдық мақсаттарға берілетін түс шкаласы */
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

/** Әрекеттің тамырдағы жылдық мақсатын табады */
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

/** Бір күнге жоспарланған әрекеттер */
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
        goal:
          root.id === g.id
            ? null
            : { id: root.id, title: root.title, color: colors.get(root.id) ?? C.accent },
        done: g.status === 'done',
      };
    })
    .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));

  return { tasks, goals: goals ?? [], ...rest };
}

/** Календарь ұяшығының жүктемесі */
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

/** Жылдық мақсаттар — «Қай мақсатқа жатады» тізімі үшін */
export function useRootGoals(): GoalRef[] {
  const { data: goals } = useGoals();
  const colors = colorMap(goals ?? []);
  return (goals ?? [])
    // ⚠ Тек 'year'. Бұрын «тамыры жоқтың бәрі» деп алынатын — сонда
    // мақсатсыз бір реттік әрекет те мақсат болып тізімге шығатын.
    .filter((g) => g.level === 'year' && g.status !== 'dropped')
    .map((g) => ({ id: g.id, title: g.title, color: colors.get(g.id) ?? C.accent }));
}

// ─────────────────────────────────────────────────────────────────────
// УАҚЫТ ҚАҢҚАСЫ — жүйе ашады, адам тимейді
// ─────────────────────────────────────────────────────────────────────

/** Мақсаттың айлары. Оларды `sync_months()` триггері өзі ашқан. */
export function useMonths(goalId: string | null): Goal[] {
  const { data: goals } = useGoals();
  if (!goalId) return [];
  return (goals ?? [])
    .filter((g) => g.parent_id === goalId && g.level === 'month' && g.status !== 'dropped')
    .sort((a, b) => a.period_start.localeCompare(b.period_start));
}

export type WeekStat = {
  start: string;
  end: string;
  total: number;
  done: number;
};

/**
 * Айдың апталық СТАТИСТИКАСЫ.
 *
 * ⚠ Апта енді құрылым емес. Ол — телефондағы «экран уақыты» сияқты фон:
 * әрекеттердің күндерінен есептеліп шығады, ештеңені ұстап тұрмайды.
 * Әрекеті жоқ апта да тізімде тұрады.
 */
export function useMonthWeekStats(monthId: string | null) {
  return useQuery({
    queryKey: ['weekStats', monthId ?? 'none'],
    enabled: !!monthId,
    queryFn: async (): Promise<WeekStat[]> => {
      const { data, error } = await supabase.rpc('month_week_stats', {
        p_month_id: monthId!,
      });
      if (error) throw error;
      return ((data ?? []) as { week_start: string; week_end: string; total: number; done: number }[])
        .map((r) => ({ start: r.week_start, end: r.week_end, total: r.total, done: r.done }));
    },
  });
}

/** Бір контейнердің тікелей әрекеттері */
export function useActions(parentId: string | null): Goal[] {
  const { data: goals } = useGoals();
  if (!parentId) return [];
  return (goals ?? [])
    .filter((g) => g.parent_id === parentId && g.level === 'day' && g.status !== 'dropped')
    .sort((a, b) => a.period_start.localeCompare(b.period_start));
}

// ─────────────────────────────────────────────────────────────────────
// Пайыз — тек серверден
// ─────────────────────────────────────────────────────────────────────

export type NodeStats = {
  goal: Goal;
  color: string;
  /** Нақты орындалу, 0–100 */
  actual: number;
  /** «Керек еді» — уақыт емес, жоспар бойынша */
  planned: number;
  gap: number;
  /** Әрекет саны */
  total: number;
  done: number;
};

async function statsFor(goal: Goal, iso: string, color: string): Promise<NodeStats> {
  const [{ data: s, error: e1 }, { data: c, error: e2 }] = await Promise.all([
    supabase.rpc('goal_stats', { p_goal_id: goal.id, p_on_date: iso }),
    supabase.rpc('action_counts', { p_goal_id: goal.id }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const stat = (Array.isArray(s) ? s[0] : (s as GoalStats | null)) ?? {
    actual: 0,
    planned: 0,
    gap: 0,
  };
  const cnt = (Array.isArray(c) ? c[0] : c) as { total: number; done: number } | null;

  return {
    goal,
    color,
    actual: Math.round(stat.actual ?? 0),
    planned: Math.round(stat.planned ?? 0),
    gap: Math.round(stat.gap ?? 0),
    total: cnt?.total ?? 0,
    done: cnt?.done ?? 0,
  };
}

/** Жылдық мақсаттар және олардың пайызы */
export function useYearGoalsWithStats(onDate: Date) {
  const { data: goals } = useGoals();
  const iso = toISODate(onDate);
  const colors = colorMap(goals ?? []);

  const years = (goals ?? []).filter((g) => g.level === 'year' && g.status !== 'dropped');
  const ids = years.map((g) => g.id).join(',');

  return useQuery({
    queryKey: ['yearStats', iso, ids],
    enabled: years.length > 0,
    queryFn: () =>
      Promise.all(years.map((g) => statsFor(g, iso, colors.get(g.id) ?? C.accent))),
  });
}

/** Бір түйіннің пайызы — мақсат немесе ай беті үшін */
export function useNodeStats(goalId: string | null, onDate: Date) {
  const { data: goals } = useGoals();
  const iso = toISODate(onDate);
  const goal = (goals ?? []).find((g) => g.id === goalId) ?? null;
  const colors = colorMap(goals ?? []);

  return useQuery({
    queryKey: ['nodeStats', goalId ?? 'none', iso],
    enabled: !!goal,
    queryFn: () => statsFor(goal!, iso, colors.get(goal!.id) ?? C.accent),
  });
}

/**
 * Бүгінгі күнді қамтитын апта, ай және жыл — Бүгін экранының жолақтары.
 * Қаңқа жүйе ашқандықтан бұл түйіндер әрқашан табылады.
 */
export function useTodayLevels(date: Date) {
  const { data: goals } = useGoals();
  const iso = toISODate(date);

  const covering = (level: Goal['level']) =>
    (goals ?? []).find(
      (g) =>
        g.level === level &&
        g.period_start <= iso &&
        g.period_end >= iso &&
        g.status !== 'dropped',
    ) ?? null;

  const week = covering('week');
  const month = covering('month');
  const year = covering('year');
  const nodes = [week, month, year].filter(Boolean) as Goal[];
  const shades = [C.accent, C.accent3, C.accent5];

  return useQuery({
    queryKey: ['todayLevels', iso, nodes.map((n) => n.id).join(',')],
    enabled: nodes.length > 0,
    queryFn: () =>
      Promise.all(nodes.map((g, i) => statsFor(g, iso, shades[i] ?? C.accent))),
  });
}

/** Балалардың (ай не апта) пайызы — тізімде көрсету үшін */
export function useChildrenStats(children: Goal[], onDate: Date) {
  const iso = toISODate(onDate);
  const ids = children.map((g) => g.id).join(',');

  return useQuery({
    queryKey: ['childrenStats', ids, iso],
    enabled: children.length > 0,
    queryFn: () => Promise.all(children.map((g) => statsFor(g, iso, C.accent))),
  });
}

// ─────────────────────────────────────────────────────────────────────
// Мутациялар
// ─────────────────────────────────────────────────────────────────────

/** Чекбокс — optimistic update, желі жауабын күтпейді */
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
        (old ?? []).map((g) => (g.id === id ? { ...g, status: done ? 'done' : 'active' } : g)),
      );
      return { prev };
    },

    onError: (_e, _v, ctx) => {
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
  /** НӘТИЖЕ — міндетті емес, пайызға ҚАТЫСПАЙДЫ */
  resultFrom?: number | null;
  resultTo?: number | null;
  resultUnit?: string | null;
};

/**
 * Жылдық мақсат құрады.
 *
 * Айларды бұл жерде ҚҰРМАЙМЫЗ — оны Postgres триггері (`sync_months`)
 * жазба сақталған сәтте өзі істейді. Сондықтан қаңқа мен мерзім
 * ешқашан алшақтап кетпейді.
 */
export function useCreateGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (g: NewGoal) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { data: created, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          parent_id: null,
          level: 'year',
          title: g.title,
          period_start: toISODate(g.start),
          period_end: toISODate(g.end),
          result_from: g.resultFrom ?? null,
          result_to: g.resultTo ?? null,
          result_unit: g.resultUnit ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;

      return created.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

export type NewAction = {
  /**
   * Қайдан қосылып жатыр — екеуінің бірі жеткілікті.
   * Ай экранынан monthId, күнтізбеден goalId келеді.
   * Айды бәрібір күн бойынша month_for_date() табады.
   */
  monthId?: string;
  /**
   * Мақсатсыз бір реттік әрекет үшін екеуін де БЕРМЕҢІЗ: сонда әрекет
   * ешбір мақсаттың тармағына кірмейді де, пайызды жылжытпайды.
   */
  goalId?: string;
  title: string;
  date: Date;
  /** `HH:MM` немесе null — уақыт МІНДЕТТІ ЕМЕС */
  time: string | null;
  /** Неше рет қайталансын: 1 = бір рет */
  repeatWeeks?: number;
};

/**
 * ӘРЕКЕТ қосады — жүйедегі жалғыз қолмен енгізілетін нәрсе.
 *
 * «Көлем» деген бөлек өріс жоқ: көлем дегеніміз — осылайша қосылған
 * әрекеттердің саны.
 *
 * ⚠ «Тек осы айға қоя аласыз» деген ШЕКТЕУ ЖОҚ. Күнтізбеден басқа
 * айдың күнін таңдасаңыз, әрекет сол айға ӨЗІ көшеді — `month_for_date()`
 * тиісті айды тауып береді. Қайталанатын әрекет айдан асып кетсе де
 * әрқайсысы өз айына түседі.
 */
export function useCreateAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (a: NewAction) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      // Тамырдағы мақсатты табамыз — айларды сол ұстап тұр
      let goalId = a.goalId ?? null;
      if (!goalId && a.monthId) {
        const { data: month, error: e1 } = await supabase
          .from('goals')
          .select('parent_id')
          .eq('id', a.monthId)
          .single();
        if (e1) throw e1;
        goalId = month.parent_id;
      }
      // Мақсат таңдалмаса — бұл жеке, бір реттік күндік жоспар.
      // parent_id null болғандықтан ол ешбір жылдық мақсаттың
      // ағашына кірмейді, демек progress() оны санамайды.

      const repeats = Math.max(a.repeatWeeks ?? 1, 1);
      const rows = [];
      let skipped = 0;

      for (let i = 0; i < repeats; i++) {
        const d = new Date(a.date);
        d.setDate(d.getDate() + i * 7);
        const iso = toISODate(d);

        // Күн қай айға түссе — сол айға тіркеледі.
        // Мақсатсыз әрекетте ай да, мерзім шектеуі де жоқ.
        let target: string | null = null;
        if (goalId) {
          const { data: found, error: e2 } = await supabase.rpc('month_for_date', {
            p_goal_id: goalId,
            p_date: iso,
          });
          if (e2) throw e2;

          // Мерзімнен тыс күн — тіркелмейді, бірақ қалғаны сақталады
          if (!found) {
            skipped += 1;
            continue;
          }
          target = found as string;
        }

        let scheduled: string | null = null;
        if (a.time) {
          const [h, m] = a.time.split(':').map(Number);
          const dt = new Date(d);
          dt.setHours(h ?? 0, m ?? 0, 0, 0);
          scheduled = dt.toISOString();
        }

        rows.push({
          user_id: userId,
          parent_id: target,
          level: 'day' as const,
          title: a.title,
          period_start: iso,
          period_end: iso,
          scheduled_at: scheduled,
        });
      }

      if (rows.length === 0) {
        throw new Error('Таңдалған күн мақсаттың мерзімінен тыс.');
      }

      const { error } = await supabase.from('goals').insert(rows);
      if (error) throw error;

      return { added: rows.length, skipped };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

export function useDeleteAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}
