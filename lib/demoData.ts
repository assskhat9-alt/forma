/**
 * Тестілеуге арналған көрнекі демо-деректер.
 *
 * Ереже (CLAUDE.md §1, §5.1):
 *   - Әдеттер goals-пен мүлде байланыспайды, пайызға кірмейді.
 *   - Эмодзи жоқ, түстер тек theme/tokens.ts ішінен.
 *   - Қазақша мәтін.
 */
import { color as C } from '../theme/tokens';
import type { Goal, Habit, HabitLog, Motto } from './database.types';
import { toISODate } from './calendar';

export const DEMO_USER_ID = 'demo-user-0000-0000-0000-000000000000';

const today = new Date();
const todayIso = toISODate(today);
const curYear = today.getFullYear();
const yearStart = `${curYear}-01-01`;
const yearEnd = `${curYear}-12-31`;

export const INITIAL_DEMO_GOALS: Goal[] = [
  // ── Жылдық мақсат 1: IT жоба ───────────────────────────────────────
  {
    id: 'demo-goal-1',
    user_id: DEMO_USER_ID,
    parent_id: null,
    level: 'year',
    title: 'Forma жобасын шығару және бета-тест өткізу',
    note: 'Expo SDK 57, Supabase, Vercel SPA',
    period_start: yearStart,
    period_end: yearEnd,
    result_from: 0,
    result_to: 100,
    result_unit: '%',
    locked: false,
    status: 'active',
    scheduled_at: null,
    completed_at: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
  },
  // ── Жылдық мақсат 2: Тіл ──────────────────────────────────────────
  {
    id: 'demo-goal-2',
    user_id: DEMO_USER_ID,
    parent_id: null,
    level: 'year',
    title: 'Ағылшын тілі — C1 Advanced деңгейі',
    note: 'Күнделікті 1 сағат оқу және тыңдау',
    period_start: yearStart,
    period_end: yearEnd,
    result_from: 0,
    result_to: 8,
    result_unit: 'IELTS',
    locked: false,
    status: 'active',
    scheduled_at: null,
    completed_at: null,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  // ── Жылдық мақсат 3: Спорт ────────────────────────────────────────
  {
    id: 'demo-goal-3',
    user_id: DEMO_USER_ID,
    parent_id: null,
    level: 'year',
    title: 'Алматы жартылай марафоны (21 км)',
    note: 'Үздіксіз жүгіруге бейімделу',
    period_start: yearStart,
    period_end: yearEnd,
    result_from: 85,
    result_to: 75,
    result_unit: 'кг',
    locked: false,
    status: 'active',
    scheduled_at: null,
    completed_at: null,
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },

  // ── Айлар (қыркүйек) ──────────────────────────────────────────────
  {
    id: 'demo-month-1',
    user_id: DEMO_USER_ID,
    parent_id: 'demo-goal-1',
    level: 'month',
    title: 'Қыркүйек айының бета сынағы',
    note: null,
    period_start: `${curYear}-09-01`,
    period_end: `${curYear}-09-30`,
    result_from: null,
    result_to: null,
    result_unit: null,
    locked: false,
    status: 'active',
    scheduled_at: null,
    completed_at: null,
    sort_order: 0,
    created_at: '2026-09-01T00:00:00Z',
  },

  // ── Күндік әрекеттер (бүгінге) ────────────────────────────────────
  {
    id: 'demo-task-1',
    user_id: DEMO_USER_ID,
    parent_id: 'demo-month-1',
    level: 'day',
    title: 'Vercel платформасының жұмысын тексеру',
    note: null,
    period_start: todayIso,
    period_end: todayIso,
    result_from: null,
    result_to: null,
    result_unit: null,
    locked: false,
    status: 'done',
    scheduled_at: `${todayIso}T09:00:00+05:00`,
    completed_at: `${todayIso}T10:30:00+05:00`,
    sort_order: 0,
    created_at: `${todayIso}T08:00:00Z`,
  },
  {
    id: 'demo-task-2',
    user_id: DEMO_USER_ID,
    parent_id: 'demo-month-1',
    level: 'day',
    title: 'Тіркелу мен кіру қателерін түзету',
    note: null,
    period_start: todayIso,
    period_end: todayIso,
    result_from: null,
    result_to: null,
    result_unit: null,
    locked: false,
    status: 'done',
    scheduled_at: `${todayIso}T11:00:00+05:00`,
    completed_at: `${todayIso}T12:15:00+05:00`,
    sort_order: 1,
    created_at: `${todayIso}T08:00:00Z`,
  },
  {
    id: 'demo-task-3',
    user_id: DEMO_USER_ID,
    parent_id: 'demo-goal-2',
    level: 'day',
    title: 'Ағылшын тілінен 15 жаңа сөз жаттау',
    note: null,
    period_start: todayIso,
    period_end: todayIso,
    result_from: null,
    result_to: null,
    result_unit: null,
    locked: false,
    status: 'active',
    scheduled_at: `${todayIso}T15:00:00+05:00`,
    completed_at: null,
    sort_order: 2,
    created_at: `${todayIso}T08:00:00Z`,
  },
  {
    id: 'demo-task-4',
    user_id: DEMO_USER_ID,
    parent_id: 'demo-goal-3',
    level: 'day',
    title: 'Кешкі 5 км жүгіру',
    note: null,
    period_start: todayIso,
    period_end: todayIso,
    result_from: null,
    result_to: null,
    result_unit: null,
    locked: false,
    status: 'active',
    scheduled_at: `${todayIso}T19:00:00+05:00`,
    completed_at: null,
    sort_order: 3,
    created_at: `${todayIso}T08:00:00Z`,
  },
];

export const INITIAL_DEMO_HABITS: Habit[] = [
  {
    id: 'demo-habit-1',
    user_id: DEMO_USER_ID,
    title: 'Таңғы 15 мин жаттығу',
    schedule: { type: 'daily' },
    color: C.accent,
    archived_at: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-habit-2',
    user_id: DEMO_USER_ID,
    title: 'Күніне 2 литр су ішу',
    schedule: { type: 'daily' },
    color: C.accent2,
    archived_at: null,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-habit-3',
    user_id: DEMO_USER_ID,
    title: '30 бет кәсіби кітап оқу',
    schedule: { type: 'weekly', days: [1, 2, 3, 4, 5] },
    color: C.accent3,
    archived_at: null,
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_DEMO_HABIT_LOGS: HabitLog[] = [
  {
    id: 'demo-log-1',
    user_id: DEMO_USER_ID,
    habit_id: 'demo-habit-1',
    log_date: todayIso,
    minutes: 15,
  },
  {
    id: 'demo-log-2',
    user_id: DEMO_USER_ID,
    habit_id: 'demo-habit-2',
    log_date: todayIso,
    minutes: null,
  },
];

export const INITIAL_DEMO_MOTTOS: Motto[] = [
  {
    id: 'demo-motto-1',
    user_id: DEMO_USER_ID,
    text: 'Үлкен мақсат бүгінгі бір ғана әрекеттен басталады.',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];
