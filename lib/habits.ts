/**
 * Әдеттер — goals-пен МҮЛДЕ байланыспайды.
 *
 * ⚠ Бұл жердегі ешбір сан мақсат пайызына қосылмайды (CLAUDE.md §5.1, §7.2).
 * Әдет — жететін нәтиже емес, күнделікті рефлекс.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import { qk } from './query';
import { toISODate } from './calendar';
import type { Habit, HabitLog, HabitSchedule } from './database.types';

export type HabitToday = {
  id: string;
  title: string;
  color: string;
  /** Осы күнге жоспарланған ба */
  planned: boolean;
  done: boolean;
};

/** schedule: {"type":"daily"} немесе {"type":"weekly","days":[1,3,5]} — 1=дүйсенбі */
export function plannedOn(schedule: HabitSchedule, date: Date): boolean {
  if (schedule.type === 'weekly') {
    const isoDow = ((date.getDay() + 6) % 7) + 1; // 1=дүйсенбі … 7=жексенбі
    return schedule.days.includes(isoDow);
  }
  return true;
}

export function useHabits() {
  return useQuery({
    queryKey: qk.habits.all,
    queryFn: async (): Promise<Habit[]> => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .is('archived_at', null)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHabitLogs(from: Date, to: Date) {
  const a = toISODate(from);
  const b = toISODate(to);

  return useQuery({
    queryKey: qk.habits.logs(a, b),
    queryFn: async (): Promise<HabitLog[]> => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('log_date', a)
        .lte('log_date', b);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Бір күнге арналған әдеттер тізімі */
export function useHabitsForDay(date: Date) {
  const { data: habits, isLoading } = useHabits();
  const { data: logs } = useHabitLogs(date, date);
  const iso = toISODate(date);

  const doneSet = new Set(
    (logs ?? []).filter((l) => l.log_date === iso).map((l) => l.habit_id),
  );

  const items: HabitToday[] = (habits ?? []).map((h) => ({
    id: h.id,
    title: h.title,
    color: h.color,
    planned: plannedOn(h.schedule, date),
    done: doneSet.has(h.id),
  }));

  return { items, isLoading };
}

/** Әдет белгісін қою/алу — optimistic */
export function useToggleHabit(date: Date) {
  const qc = useQueryClient();
  const iso = toISODate(date);
  const key = qk.habits.logs(iso, iso);

  return useMutation({
    mutationFn: async ({ habitId, done }: { habitId: string; done: boolean }) => {
      if (done) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session.session?.user.id;
        if (!userId) throw new Error('Сессия жоқ');

        const { error } = await supabase
          .from('habit_logs')
          .insert({ user_id: userId, habit_id: habitId, log_date: iso });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('log_date', iso);
        if (error) throw error;
      }
    },

    onMutate: async ({ habitId, done }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<HabitLog[]>(key);

      qc.setQueryData<HabitLog[]>(key, (old) => {
        const list = old ?? [];
        if (done) {
          return [
            ...list,
            { id: `tmp-${habitId}`, user_id: '', habit_id: habitId, log_date: iso, minutes: null },
          ];
        }
        return list.filter((l) => !(l.habit_id === habitId && l.log_date === iso));
      });

      return { prev };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
