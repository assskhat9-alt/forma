/**
 * Supabase клиенті.
 *
 * Кілттер `.env` файлынан келеді (`.env.example` қараңыз). Expo тек
 * `EXPO_PUBLIC_` префиксі бар айнымалыларды бандлға қосады.
 *
 * anon key құпия емес — қауіпсіздік RLS арқылы қамтамасыз етіледі
 * (supabase/migrations/0002_rls.sql). Сондықтан `service_role` кілтін
 * қосымшаға ЕШҚАШАН салмаңыз.
 */
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Database, GoalStats } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;

// Supabase кілттің екі пішімін қатар ұстайды: ескісі `eyJ…` (anon JWT),
// жаңасы `sb_publishable_…`. Екеуі де клиент үшін бірдей жұмыс істейді.
// Expo `process.env.EXPO_PUBLIC_*` өрнегін бандл кезінде мәнге алмастырады,
// сондықтан екеуі де ашық жазылған — динамикалық оқу жұмыс істемейді.
const publicKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !publicKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL және EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY орнатылмаған. ' +
      '.env.example файлын .env деп көшіріп, мәндерін толтырыңыз.',
  );
}

export const supabase = createClient<Database>(url, publicKey, {
  auth: {
    // Вебте AsyncStorage жоқ — localStorage өзі қолданылады
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Мобильде URL-де сессия болмайды, вебте OAuth қайтарымы үшін керек
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// ── Auth көмекшілері ────────────────────────────────────────────────

export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// ── Есеп RPC-лері ───────────────────────────────────────────────────
//
// ⚠ Пайызды клиентте ҚАЙТА ЕСЕПТЕМЕҢІЗ (CLAUDE.md §5.1).
// Бір ғана ақиқат көзі — Postgres функциялары.

/** Нақты орындалу, «керек еді» және айырма — бір сұрауда */
export async function fetchGoalStats(
  goalId: string,
  onDate?: string,
): Promise<GoalStats> {
  const { data, error } = await supabase.rpc('goal_stats', {
    p_goal_id: goalId,
    ...(onDate ? { p_on_date: onDate } : {}),
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : (data as GoalStats | null);
  return row ?? { actual: 0, planned: 0, gap: 0 };
}

export async function fetchHabitStreak(habitId: string, today?: string): Promise<number> {
  const { data, error } = await supabase.rpc('habit_streak', {
    p_habit_id: habitId,
    ...(today ? { p_today: today } : {}),
  });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

export async function fetchHabitConsistency(
  habitId: string,
  today?: string,
): Promise<number> {
  const { data, error } = await supabase.rpc('habit_consistency', {
    p_habit_id: habitId,
    ...(today ? { p_today: today } : {}),
  });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}
