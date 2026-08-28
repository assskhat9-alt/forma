/**
 * Уақыт есебі — фокус сессияларының жиынтығы.
 *
 * Екі деңгей:
 *   1. Жалпы  — барлық мақсатқа кеткен уақыт, мақсат бойынша бөлінісі.
 *              Кезең таңдау мұнда ЖОҚ: сұрақ «бәрі қанша» дегенде ғана.
 *   2. Мақсат — сол мақсаттың апталары: күндік бағаналар, қай әрекетке
 *      қанша кеткені, өткен аптамен салыстыру. Кезеңмен жұмыс осында.
 *
 * ⚠ Мұндағы бірде-бір сан ойдан шықпайды. Салыстыру да нақты: өткен
 * аптаның дәл сол ұзындықтағы сессиялары есептеледі. Дерек болмаса
 * айырма МҮЛДЕ көрсетілмейді.
 *
 * ⚠ Бұл уақыт мақсаттың ПАЙЫЗЫНА қатыспайды: пайыз орындалған
 * әрекеттен есептеледі, отырған сағаттан емес (CLAUDE.md §1).
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';
import { useGoals, useRootGoals } from './goals';
import { color as C } from '../theme/tokens';
import type { Goal, FocusSession } from './database.types';

/** Мақсатқа тіркелмеген уақыт осы жолмен жүреді */
export const OTHER = { id: '__other__', title: 'Жеке шаруа', color: C.ink4 };

const DAY_MS = 86_400_000;

/** «Бәрі» кезеңінің басы — қолданба бұдан бұрын болған жоқ */
const EPOCH = new Date('2020-01-01T00:00:00');

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Дүйсенбіден басталатын аптаның басы */
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  return addDays(x, -((x.getDay() + 6) % 7));
}

/** `95` → `1 сағ 35 мин` */
export function fmtMinutes(m: number): string {
  const n = Math.round(m);
  const h = Math.floor(n / 60);
  const mm = n % 60;
  if (h === 0) return `${mm} мин`;
  if (mm === 0) return `${h} сағ`;
  return `${h} сағ ${mm} мин`;
}

/** Бағананың үстіндегі ықшам жазу: `2,5с` немесе `40м` */
export function fmtShort(m: number): string {
  if (m <= 0) return '—';
  if (m < 60) return `${Math.round(m)}м`;
  return `${(Math.round((m / 60) * 10) / 10).toString().replace('.', ',')}с`;
}

const SHORT = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жк'] as const;

// ─────────────────────────────────────────────────────────────────────
// Ортақ бөлік
// ─────────────────────────────────────────────────────────────────────

function useSessions(from: Date, to: Date) {
  return useQuery({
    queryKey: ['sessions', from.toISOString(), to.toISOString()],
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
}

/** Сессияны тамырдағы жылдық мақсатқа апаратын көмекші */
function useRootIndex() {
  const { data: goals } = useGoals();
  const rootGoals = useRootGoals();

  const byId = new Map((goals ?? []).map((g) => [g.id, g]));
  const colorOf = new Map(rootGoals.map((g) => [g.id, g.color]));

  /** Әрекеттің өзі — сессия соған тіркеледі */
  const actionOf = (goalId: string | null): Goal | null =>
    goalId ? byId.get(goalId) ?? null : null;

  const rootOf = (goalId: string | null) => {
    if (!goalId) return OTHER;
    let cur = byId.get(goalId);
    const seen = new Set<string>();
    while (cur?.parent_id && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_id);
    }
    // Тамыры жоқ немесе жылдық мақсат емес — бұл жеке шаруа
    if (!cur || !colorOf.has(cur.id)) return OTHER;
    return { id: cur.id, title: cur.title, color: colorOf.get(cur.id) ?? C.accent };
  };

  return { rootOf, actionOf };
}

// ─────────────────────────────────────────────────────────────────────
// 1-деңгей: жалпы уақыт және мақсат бойынша бөлінісі
// ─────────────────────────────────────────────────────────────────────

export type GoalTime = {
  id: string;
  title: string;
  color: string;
  minutes: number;
  /** Жалпы уақыттағы үлесі */
  pct: number;
};

/**
 * Мақсаттарға кеткен ЖАЛПЫ уақыт.
 *
 * ⚠ Кезең таңдау жоқ — бұл бет бүкіл уақытты көрсетеді. Апта бойынша
 * бөлу мақсаттың өз бетінде, ол жерде артқа қайтуға да болады.
 */
export function useTimeOverview(now: Date) {
  const from = EPOCH;
  const to = addDays(now, 1);
  const q = useSessions(from, to);
  const { rootOf } = useRootIndex();

  const rows = q.data ?? [];
  const total = rows.reduce((a, r) => a + (r.minutes ?? 0), 0);

  const byGoal = new Map<string, GoalTime>();
  for (const r of rows) {
    const root = rootOf(r.goal_id);
    const cur = byGoal.get(root.id);
    if (cur) cur.minutes += r.minutes ?? 0;
    else
      byGoal.set(root.id, {
        id: root.id,
        title: root.title,
        color: root.color,
        minutes: r.minutes ?? 0,
        pct: 0,
      });
  }

  const goals = [...byGoal.values()]
    .map((g) => ({ ...g, pct: total ? Math.round((g.minutes / total) * 100) : 0 }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    from,
    to: addDays(to, -1),
    total,
    sessions: rows.length,
    goals,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 2-деңгей: бір мақсаттың бір аптасы
// ─────────────────────────────────────────────────────────────────────

export type DayTime = { date: Date; short: string; minutes: number; today: boolean };
export type ActionTime = { id: string; title: string; minutes: number; date: string | null };

/**
 * Бір мақсаттың бір аптасы.
 *
 * `weekStart` — дүйсенбі. Өткен аптаны көру үшін оны 7 күнге кері
 * жылжыту жеткілікті: сұраныс сол аптаны және салыстыру үшін одан
 * бұрынғысын алады.
 */
export function useGoalWeek(goalId: string | null, weekStart: Date, now: Date) {
  const from = startOfWeek(weekStart);
  const to = addDays(from, 7);
  const prevFrom = addDays(from, -7);

  const q = useSessions(prevFrom, to);
  const { rootOf, actionOf } = useRootIndex();

  const mine = (q.data ?? []).filter((r) => rootOf(r.goal_id).id === goalId);
  const at = (r: FocusSession) => new Date(r.created_at).getTime();

  const current = mine.filter((r) => at(r) >= from.getTime());
  const previous = mine.filter((r) => at(r) < from.getTime());

  const total = current.reduce((a, r) => a + (r.minutes ?? 0), 0);
  const prevTotal = previous.reduce((a, r) => a + (r.minutes ?? 0), 0);

  // ── күндік бағаналар ──
  const days: DayTime[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i);
    return {
      date,
      short: SHORT[i]!,
      minutes: 0,
      today: date.getTime() === startOfDay(now).getTime(),
    };
  });

  for (const r of current) {
    const i = Math.floor((startOfDay(new Date(r.created_at)).getTime() - from.getTime()) / DAY_MS);
    const bucket = days[Math.min(Math.max(i, 0), 6)];
    if (bucket) bucket.minutes += r.minutes ?? 0;
  }

  // ── қай әрекетке қанша кеткені ──
  const byAction = new Map<string, ActionTime>();
  for (const r of current) {
    const a = actionOf(r.goal_id);
    const id = a?.id ?? OTHER.id;
    const cur = byAction.get(id);
    if (cur) cur.minutes += r.minutes ?? 0;
    else
      byAction.set(id, {
        id,
        title: a?.title ?? OTHER.title,
        minutes: r.minutes ?? 0,
        date: a?.period_start ?? null,
      });
  }

  const actions = [...byAction.values()].sort((a, b) => b.minutes - a.minutes);

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    from,
    to: addDays(to, -1),
    total,
    prevTotal,
    /** Салыстыруға дерек болмаса null — нөл деп көрсету жаңылтады */
    delta: previous.length > 0 ? total - prevTotal : null,
    days,
    actions,
    sessions: current.length,
    /** Келер аптаға өтуге бола ма — болашақты қарауға болмайды */
    canGoNext: to.getTime() <= startOfDay(now).getTime(),
  };
}

/** Мақсаттың бүкіл уақыты — апталық көріністің тақырыбында тұрады */
export function useGoalTotal(goalId: string | null, now: Date) {
  const q = useSessions(EPOCH, addDays(now, 1));
  const { rootOf } = useRootIndex();

  const mine = (q.data ?? []).filter((r) => rootOf(r.goal_id).id === goalId);
  return mine.reduce((a, r) => a + (r.minutes ?? 0), 0);
}
