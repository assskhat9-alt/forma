/**
 * Архив — аяқталған мен жабылғанның тарихы.
 *
 * ⚠ Мұнда ештеңе жойылмайды және қайта есептелмейді. Архив — өткенді
 * көрсететін терезе: істелген іс, оған жазылған ой және сол кездегі
 * көңіл-күй сол күйінде тұрады.
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';
import { toISODate } from './calendar';
import { useGoals, useRootGoals } from './goals';
import { color as C } from '../theme/tokens';
import type { Goal, Reflection } from './database.types';

/** Диаграммада қанша ай көрсетіледі */
const MONTHS = 8;

export type ArchiveKind = 'all' | 'action' | 'goal' | 'dropped';

export type ArchiveEntry = {
  id: string;
  title: string;
  /** Аяқталған сәт, болмаса жоспарланған күні */
  date: string;
  level: Goal['level'];
  dropped: boolean;
  goal: { title: string; color: string } | null;
  /** Осы іске жазылған рефлексия */
  note: string | null;
  mood: number | null;
};

export type MonthBar = { key: string; label: string; pct: number; total: number };

/** Барлық рефлексия — архивте әр істің қасында тұрады */
export function useReflections() {
  return useQuery({
    queryKey: ['reflections', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Reflection[];
    },
  });
}

const MONTH_SHORT = [
  'қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау',
  'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел',
];

export function useArchive(kind: ArchiveKind, now: Date) {
  const { data: goals, isLoading } = useGoals();
  const refl = useReflections();
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

  /** Бір істің соңғы рефлексиясы */
  const noteOf = new Map<string, Reflection>();
  for (const r of refl.data ?? []) {
    if (r.goal_id && !noteOf.has(r.goal_id)) noteOf.set(r.goal_id, r);
  }

  const done = all.filter((g) => g.status === 'done');
  const dropped = all.filter((g) => g.status === 'dropped');

  const toEntry = (g: Goal): ArchiveEntry => {
    const r = noteOf.get(g.id);
    return {
      id: g.id,
      title: g.title,
      date: g.completed_at ? toISODate(new Date(g.completed_at)) : g.period_start,
      level: g.level,
      dropped: g.status === 'dropped',
      goal: rootOf(g),
      note: r?.body ?? null,
      mood: r?.rating ?? null,
    };
  };

  const pool =
    kind === 'dropped'
      ? dropped
      : kind === 'action'
        ? done.filter((g) => g.level === 'day')
        : kind === 'goal'
          ? done.filter((g) => g.level !== 'day')
          : [...done, ...dropped];

  const entries = pool
    .map(toEntry)
    .sort((a, b) => b.date.localeCompare(a.date));

  // ── Ай сайынғы орындалу ──
  const bars: MonthBar[] = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // ⚠ Жабылғаны есепке кірмейді: ол «істелмеді» емес, «бас тарттым»
    const rows = all.filter(
      (g) =>
        g.level === 'day' &&
        g.status !== 'dropped' &&
        g.period_start.startsWith(prefix),
    );
    const doneCount = rows.filter((g) => g.status === 'done').length;

    return {
      key: prefix,
      label: MONTH_SHORT[d.getMonth()]!,
      pct: rows.length ? Math.round((doneCount / rows.length) * 100) : 0,
      total: rows.length,
    };
  });

  const scored = bars.filter((b) => b.total > 0);
  const average = scored.length
    ? Math.round(scored.reduce((a, b) => a + b.pct, 0) / scored.length)
    : 0;

  return {
    isLoading: isLoading || refl.isLoading,
    isError: refl.isError,
    error: refl.error,
    entries,
    bars,
    average,
    /** Тақтадағы сандар — кезеңге тәуелсіз, бүкіл тарих бойынша */
    doneActions: done.filter((g) => g.level === 'day').length,
    reflections: (refl.data ?? []).length,
    droppedCount: dropped.length,
  };
}
