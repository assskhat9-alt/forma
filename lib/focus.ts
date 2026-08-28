/**
 * Фокус таймері.
 *
 * ⚠ Ұстаным: жүйе ЕШТЕҢЕНІ ӨЗІ ІСТЕМЕЙДІ. Әрекеттің уақыты келгенде
 * тек ҰСЫНЫС шығады — таймерді қосу-қоспауды адам шешеді. Автоматты
 * қосылу жоқ.
 *
 * Таймердің күйі zustand-та тұрады (CLAUDE.md §2): экраннан шықса да
 * жүріп тұруы керек.
 */
import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import { qk } from './query';
import { toISODate } from './calendar';
import { useGoals } from './goals';
import type { Goal, FocusSession } from './database.types';

/**
 * Жылдам нұсқалар. ⚠ ШЕКТЕУ ЕМЕС — кез келген ұзақтықты қолмен
 * қоюға болады, ал таймер белгіленген уақыттан асып кетсе де
 * тоқтамайды: артық уақыт бөлек саналады.
 */
export const PRESETS = [25, 45, 60, 90] as const;

/** Қолмен қоюдың шегі — тәулік */
export const MAX_MINUTES = 24 * 60;

type FocusState = {
  /** Қай әрекетке — null болса таймер бос жүреді */
  taskId: string | null;
  taskTitle: string;
  presetMinutes: number;
  running: boolean;
  /** Жүріп тұрған кезеңнің басталған сәті (epoch ms) */
  startedAt: number | null;
  /** Кідірістерге дейін жиналған уақыт (ms) */
  accumulated: number;
  /** Сессия бірінші рет басталған сәт — focus_sessions.started_at */
  sessionStart: string | null;

  attach: (taskId: string | null, title: string) => void;
  setPreset: (minutes: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  /** Өткен уақыт, миллисекунд */
  elapsedMs: (now: number) => number;
};

export const useFocusStore = create<FocusState>((set, get) => ({
  taskId: null,
  taskTitle: '',
  presetMinutes: PRESETS[1],
  running: false,
  startedAt: null,
  accumulated: 0,
  sessionStart: null,

  attach: (taskId, title) => {
    const cur = get();
    // Басқа тапсырмаға ауысса — таймер нөлден басталады
    if (cur.taskId !== taskId) {
      set({
        taskId,
        taskTitle: title,
        running: false,
        startedAt: null,
        accumulated: 0,
        sessionStart: null,
      });
    } else {
      set({ taskTitle: title });
    }
  },

  // ⚠ Ұзақтықты өзгерту өткен уақытты ЖОЙМАЙДЫ. Отырған жерде
  // «тағы 15 минут» деп ұзартуға болады.
  setPreset: (minutes) =>
    set({ presetMinutes: Math.min(Math.max(minutes, 1), MAX_MINUTES) }),

  start: () =>
    set((s) => ({
      running: true,
      startedAt: Date.now(),
      sessionStart: s.sessionStart ?? new Date().toISOString(),
    })),

  pause: () =>
    set((s) => ({
      running: false,
      accumulated: s.accumulated + (s.startedAt ? Date.now() - s.startedAt : 0),
      startedAt: null,
    })),

  reset: () =>
    set({ running: false, startedAt: null, accumulated: 0, sessionStart: null }),

  elapsedMs: (now) => {
    const s = get();
    const live = s.running && s.startedAt ? now - s.startedAt : 0;
    // ⚠ Теріс болып кетпеуі керек: сағат артқа жүрсе де нөлден төмен емес
    return Math.max(s.accumulated + Math.max(live, 0), 0);
  },
}));

// ─────────────────────────────────────────────────────────────────────
// «Уақыты келді» — ҰСЫНЫС, автоматты қосылу емес
// ─────────────────────────────────────────────────────────────────────

/** Ұсыныс қай әрекеттер үшін жабылған — тек ағымдағы сессияда есте тұрады */
type DismissState = {
  dismissed: Set<string>;
  dismiss: (id: string) => void;
};

export const useDismissStore = create<DismissState>((set) => ({
  dismissed: new Set<string>(),
  dismiss: (id) =>
    set((s) => {
      const next = new Set(s.dismissed);
      next.add(id);
      return { dismissed: next };
    }),
}));

/** Уақыт терезесі: белгіленген сәттен 5 мин бұрын — 30 мин кейін */
const BEFORE_MS = 5 * 60_000;
const AFTER_MS = 30 * 60_000;

/**
 * Уақыты келген, әлі орындалмаған әрекет.
 *
 * Тек уақыты қойылған әрекеттер қаралады: уақытсыз әрекет — күн бойы
 * істелетін нәрсе, оны еске салудың мәні жоқ.
 */
export function useDueAction(now: Date): Goal | null {
  const { data: goals } = useGoals();
  const dismissed = useDismissStore((s) => s.dismissed);
  const t = now.getTime();

  const due = (goals ?? []).find((g) => {
    if (g.level !== 'day' || g.status !== 'active') return false;
    if (!g.scheduled_at) return false;
    if (dismissed.has(g.id)) return false;

    const at = new Date(g.scheduled_at).getTime();
    if (Number.isNaN(at)) return false;
    return t >= at - BEFORE_MS && t <= at + AFTER_MS;
  });

  return due ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Сессияны сақтау
// ─────────────────────────────────────────────────────────────────────

export function useSaveSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (s: {
      goalId: string | null;
      minutes: number;
      startedAt: string | null;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { error } = await supabase.from('focus_sessions').insert({
        user_id: userId,
        goal_id: s.goalId,
        habit_id: null,
        started_at: s.startedAt,
        minutes: s.minutes,
        source: 'timer',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const today = toISODate(new Date());
      qc.invalidateQueries({ queryKey: qk.focus.range(today, today) });
    },
  });
}

export type FocusSlice = { title: string; minutes: number; color: string };

/** Бүгінгі фокус: жалпы минут және мақсат бойынша бөлінісі */
export function useTodayFocus(date: Date) {
  const iso = toISODate(date);
  const { data: goals } = useGoals();

  return useQuery({
    queryKey: qk.focus.range(iso, iso),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .gte('created_at', `${iso}T00:00:00`)
        .lte('created_at', `${iso}T23:59:59`);
      if (error) throw error;

      const rows = (data ?? []) as FocusSession[];
      const total = rows.reduce((a, r) => a + (r.minutes ?? 0), 0);

      // Мақсат бойынша жинақтау — тамырдағы жылдық мақсатқа дейін көтеріледі
      const byId = new Map((goals ?? []).map((g) => [g.id, g]));
      const byGoal = new Map<string, number>();

      for (const r of rows) {
        let label = 'Басқа';
        if (r.goal_id) {
          let cur = byId.get(r.goal_id);
          const seen = new Set<string>();
          while (cur?.parent_id && !seen.has(cur.id)) {
            seen.add(cur.id);
            cur = byId.get(cur.parent_id);
          }
          label = cur?.title ?? 'Басқа';
        }
        byGoal.set(label, (byGoal.get(label) ?? 0) + (r.minutes ?? 0));
      }

      return { total, byGoal: [...byGoal.entries()].sort((a, b) => b[1] - a[1]) };
    },
  });
}

/** `4:40` — сағат:минут */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** `24:59` — таймердегі кері санақ */
export function formatClock(ms: number): string {
  const left = Math.max(Math.ceil(ms / 1000), 0);
  const m = Math.floor(left / 60);
  const s = left % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
