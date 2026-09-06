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
import * as Linking from 'expo-linking';

import type { Database, GoalStats } from './database.types';

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://wgkdwrkromuyqjfxkvwr.supabase.co';

// Supabase кілттің екі пішімін қатар ұстайды: ескісі `eyJ…` (anon JWT),
// жаңасы `sb_publishable_…`. Екеуі де клиент үшін бірдей жұмыс істейді.
// Expo `process.env.EXPO_PUBLIC_*` өрнегін бандл кезінде мәнге алмастырады,
// сондықтан екеуі де ашық жазылған — динамикалық оқу жұмыс істемейді.
const publicKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_26GMtxL66-BfS_Ea2USrEA_BAvGLp3e';

if (!url || !publicKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL және EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY орнатылмаған.',
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

export async function signInWithApple() {
  if (Platform.OS === 'ios') {
    try {
      const AppleAuth = await import('expo-apple-authentication');
      const isAvailable = await AppleAuth.isAvailableAsync();
      if (isAvailable) {
        const credential = await AppleAuth.signInAsync({
          requestedScopes: [
            AppleAuth.AppleAuthenticationScope.FULL_NAME,
            AppleAuth.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!credential.identityToken) {
          throw new Error('Apple ID таңбасы алынбады.');
        }
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;
        return data;
      }
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === 'ERR_REQUEST_CANCELED') {
        return null;
      }
      throw e;
    }
  }

  // Веб және басқа платформалар: Supabase OAuth арқылы
  const redirectTo =
    Platform.OS === 'web'
      ? typeof window !== 'undefined'
        ? window.location.origin
        : undefined
      : Linking.createURL('/');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;

  if (data?.url) {
    try {
      const resp = await fetch(data.url, { method: 'GET' });
      if (!resp.ok) {
        const json = (await resp.json().catch(() => ({}))) as { msg?: string };
        if (
          json?.msg?.includes('provider is not enabled') ||
          json?.msg?.includes('Unsupported provider')
        ) {
          throw new Error(
            'Supabase-те Apple арқылы кіру әлі қосылмаған (Authentication → Providers → Apple). Тест кезеңінде төмендегі Email арқылы кіріңіз.',
          );
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('Supabase-те Apple')) {
        throw e;
      }
    }

    if (typeof window !== 'undefined') {
      window.location.href = data.url;
    }
  }

  return data;
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
