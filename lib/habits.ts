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

// ─────────────────────────────────────────────────────────────────────
// Серия мен тұрақтылық
// ─────────────────────────────────────────────────────────────────────

/**
 * Есеп жүргізілетін терезе.
 *
 * ⚠ Рекорд осы терезенің ІШІНДЕ ізделеді. Бір жыл алынған себебі:
 * қысқа терезеде «рекорд» деген сөз өтірік болып шығады.
 */
const WINDOW_DAYS = 365;

export type HabitStat = {
  id: string;
  title: string;
  color: string;
  schedule: HabitSchedule;
  /** Соңғы 7 күн, ең ескісі бірінші */
  week: { date: Date; short: string; planned: boolean; done: boolean; future: boolean }[];
  /** Бүгінге дейінгі үзіліссіз серия */
  streak: number;
  /** Терезе ішіндегі ең ұзын үзіліссіз серия */
  best: number;
  /** Соңғы 30 күндегі орындалу: орындалған ÷ жоспарланған */
  pct: number;
  doneToday: boolean;
  plannedToday: boolean;
};

const SHORT = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жк'] as const;

function shiftDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Әдеттердің толық көрінісі: серия, соңғы апта және 30 күндік тұрақтылық.
 *
 * ⚠ Серия ЖОСПАРЛАНҒАН күндер бойынша есептеледі. Аптасына үш рет
 * жасалатын әдет қалған төрт күні үзілді деп саналмайды — әйтпесе сан
 * әдетті емес, кестені өлшейтін еді.
 *
 * ⚠ Бүгінгі күн әлі бітпеген: жоспарланып, бірақ орындалмаса серия
 * үзілмейді, кешеден бастап саналады.
 */
export function useHabitStats(today: Date) {
  const { data: habits, isLoading } = useHabits();
  const from = shiftDays(today, -WINDOW_DAYS);
  const { data: logs } = useHabitLogs(from, today);

  const doneKeys = new Set((logs ?? []).map((l) => `${l.habit_id}|${l.log_date}`));
  const isDone = (id: string, d: Date) => doneKeys.has(`${id}|${toISODate(d)}`);

  const items: HabitStat[] = (habits ?? []).map((h) => {
    // ── соңғы 7 күн ──
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = shiftDays(today, i - 6);
      return {
        date,
        short: SHORT[(date.getDay() + 6) % 7]!,
        planned: plannedOn(h.schedule, date),
        done: isDone(h.id, date),
        future: false,
      };
    });

    // ── серия ──
    let streak = 0;
    // Бүгін жоспарланып, әлі орындалмаса — күн бітпеген, кешеден бастаймыз
    const startsToday = !plannedOn(h.schedule, today) || isDone(h.id, today);
    for (let i = startsToday ? 0 : 1; i < WINDOW_DAYS; i++) {
      const d = shiftDays(today, -i);
      if (!plannedOn(h.schedule, d)) continue;
      if (!isDone(h.id, d)) break;
      streak += 1;
    }

    /**
     * ── Рекорд ──
     *
     * Терезені кері қарай аралап, ең ұзын үзіліссіз тізбекті табамыз.
     * ⚠ Жоспарланбаған күн тізбекті ҮЗБЕЙДІ: аптасына үш рет жасалатын
     * әдет қалған төрт күні үзілген болып саналмауы керек.
     */
    let best = 0;
    let run = 0;
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = shiftDays(today, -i);
      if (!plannedOn(h.schedule, d)) continue;
      // Бүгін әлі бітпеген — оны үзілді деп санамаймыз
      if (i === 0 && !isDone(h.id, d)) break;
      if (isDone(h.id, d)) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }

    // ── 30 күндік тұрақтылық ──
    let planned30 = 0;
    let done30 = 0;
    for (let i = 0; i < 30; i++) {
      const d = shiftDays(today, -i);
      if (!plannedOn(h.schedule, d)) continue;
      planned30 += 1;
      if (isDone(h.id, d)) done30 += 1;
    }

    return {
      id: h.id,
      title: h.title,
      color: h.color ?? '#7A6CF0',
      schedule: h.schedule,
      week,
      streak,
      best,
      pct: planned30 ? Math.round((done30 / planned30) * 100) : 0,
      doneToday: isDone(h.id, today),
      plannedToday: plannedOn(h.schedule, today),
    };
  });

  const plannedToday = items.filter((i) => i.plannedToday);
  const doneToday = plannedToday.filter((i) => i.doneToday).length;

  // Айдағы тұрақтылық — айдың басынан бүгінге дейін
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  let mPlanned = 0;
  let mDone = 0;
  for (const h of habits ?? []) {
    for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
      if (!plannedOn(h.schedule, d)) continue;
      mPlanned += 1;
      if (isDone(h.id, d)) mDone += 1;
    }
  }

  return {
    isLoading,
    items,
    doneToday,
    plannedToday: plannedToday.length,
    /** Қазір жүріп жатқан сериялардың ең ұзыны */
    currentStreak: items.reduce((a, i) => Math.max(a, i.streak), 0),
    /** Жыл ішіндегі ең ұзын серия — рекорд */
    bestStreak: items.reduce((a, i) => Math.max(a, i.best), 0),
    monthPct: mPlanned ? Math.round((mDone / mPlanned) * 100) : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Қосу және мұрағаттау
// ─────────────────────────────────────────────────────────────────────

/** Түс палитрасы — қосылу кезегі бойынша беріледі */
const HABIT_COLORS = ['#7A6CF0', '#8B7DF3', '#9A8DF5', '#AA9EF7', '#BDB4FA'];

export function useCreateHabit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (h: { title: string; schedule: HabitSchedule; index: number }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { error } = await supabase.from('habits').insert({
        user_id: userId,
        title: h.title,
        schedule: h.schedule,
        color: HABIT_COLORS[h.index % HABIT_COLORS.length],
        sort_order: h.index,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.habits.all }),
  });
}

/**
 * Әдетті мұрағаттау.
 *
 * ⚠ Жойылмайды: жазбалары қалады, әйтпесе өткен айдың тұрақтылығы
 * кейін өзгеріп кетер еді.
 */
export function useArchiveHabit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.habits.all }),
  });
}
