/**
 * Уақыт есебі — фокус сессияларының жиынтығы.
 *
 * ⚠ Мұндағы бірде-бір сан ойдан шықпайды. «Өткен аптадан +2 сағат»
 * деген айырма да нақты: алдыңғы кезеңнің дәл сол ұзындықтағы
 * сессиялары есептеліп, айырмасы алынады. Салыстыруға дерек жетпесе
 * айырма МҮЛДЕ көрсетілмейді.
 *
 * Бөліну (bucket) кезеңге қарай өзгереді:
 *   күн  → 3 сағаттық 8 бөлік
 *   апта → 7 күндік бағана
 *   ай   → 4 апталық бағана
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';
import { useGoals, useRootGoals } from './goals';
import { color as C } from '../theme/tokens';
import type { FocusSession } from './database.types';

export type ReportRange = 'day' | 'week' | 'month';

/** Бір бағана: жалпы уақыты және мақсаттар бойынша қабаттары */
export type ReportBar = {
  key: string;
  label: string;
  minutes: number;
  segments: { id: string; color: string; minutes: number }[];
};

export type ReportGoal = {
  id: string;
  title: string;
  color: string;
  minutes: number;
  /** Кезеңдегі үлесі */
  pct: number;
};

/** Мақсатқа тіркелмеген уақыт осы жолмен жүреді */
const OTHER = { id: '__other__', title: 'Жеке шаруа', color: C.ink4 };

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Кезеңнің ұзындығы — тәулікпен */
function spanDays(range: ReportRange): number {
  return range === 'day' ? 1 : range === 'week' ? 7 : 28;
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

export function useTimeReport(range: ReportRange, anchor: Date) {
  const { data: goals } = useGoals();
  const rootGoals = useRootGoals();

  const days = spanDays(range);
  const to = addDays(startOfDay(anchor), 1); // ашық шек
  const from = addDays(to, -days);
  const prevFrom = addDays(from, -days);

  const q = useQuery({
    queryKey: ['timeReport', range, from.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .gte('created_at', prevFrom.toISOString())
        .lt('created_at', to.toISOString());
      if (error) throw error;
      return (data ?? []) as FocusSession[];
    },
  });

  const rows = q.data ?? [];

  // ── Әр сессияны тамырдағы мақсатқа апару ──
  const byId = new Map((goals ?? []).map((g) => [g.id, g]));
  const colorOf = new Map(rootGoals.map((g) => [g.id, g.color]));

  const rootOf = (goalId: string | null) => {
    if (!goalId) return OTHER;
    let cur = byId.get(goalId);
    const seen = new Set<string>();
    while (cur?.parent_id && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_id);
    }
    // Тамыры жоқ немесе өзі болса — бұл жеке шаруа, мақсат емес
    if (!cur || !colorOf.has(cur.id)) return OTHER;
    return { id: cur.id, title: cur.title, color: colorOf.get(cur.id) ?? C.accent };
  };

  const inRange = (r: FocusSession, a: Date, b: Date) => {
    const t = new Date(r.created_at).getTime();
    return t >= a.getTime() && t < b.getTime();
  };

  const current = rows.filter((r) => inRange(r, from, to));
  const previous = rows.filter((r) => inRange(r, prevFrom, from));

  const total = current.reduce((a, r) => a + (r.minutes ?? 0), 0);
  const prevTotal = previous.reduce((a, r) => a + (r.minutes ?? 0), 0);

  // ── Бағаналар ──
  const bucketCount = range === 'day' ? 8 : range === 'week' ? 7 : 4;

  /** Сессия қай бағанаға түседі */
  const bucketOf = (r: FocusSession): number => {
    const d = new Date(r.created_at);
    if (range === 'day') return Math.min(Math.floor(d.getHours() / 3), 7);
    const offset = Math.floor((startOfDay(d).getTime() - from.getTime()) / DAY_MS);
    return range === 'week'
      ? Math.min(Math.max(offset, 0), 6)
      : Math.min(Math.max(Math.floor(offset / 7), 0), 3);
  };

  const labelOf = (i: number): string => {
    if (range === 'day') return `${String(i * 3).padStart(2, '0')}`;
    if (range === 'week') {
      const d = addDays(from, i);
      return ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жк'][(d.getDay() + 6) % 7]!;
    }
    const d = addDays(from, i * 7);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const bars: ReportBar[] = Array.from({ length: bucketCount }, (_, i) => ({
    key: `b${i}`,
    label: labelOf(i),
    minutes: 0,
    segments: [] as ReportBar['segments'],
  }));

  const sumInto = (bar: ReportBar, id: string, color: string, minutes: number) => {
    bar.minutes += minutes;
    const seg = bar.segments.find((s) => s.id === id);
    if (seg) seg.minutes += minutes;
    else bar.segments.push({ id, color, minutes });
  };

  for (const r of current) {
    const root = rootOf(r.goal_id);
    sumInto(bars[bucketOf(r)]!, root.id, root.color, r.minutes ?? 0);
  }

  // ── Мақсаттар бойынша ──
  const perGoal = new Map<string, ReportGoal>();
  for (const r of current) {
    const root = rootOf(r.goal_id);
    const cur = perGoal.get(root.id);
    if (cur) cur.minutes += r.minutes ?? 0;
    else
      perGoal.set(root.id, {
        id: root.id,
        title: root.title,
        color: root.color,
        minutes: r.minutes ?? 0,
        pct: 0,
      });
  }

  const goalList = [...perGoal.values()]
    .map((g) => ({ ...g, pct: total ? Math.round((g.minutes / total) * 100) : 0 }))
    .sort((a, b) => b.minutes - a.minutes);

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
    sessions: current.length,
    /** Күніне орташа — бір күндік есепте мағынасы жоқ, сондықтан null */
    perDay: range === 'day' ? null : total / days,
    bars,
    goals: goalList,
  };
}
