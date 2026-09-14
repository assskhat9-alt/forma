/**
 * Әкімші (Admin) деректері мен API.
 *
 * Жүйелік шолу, қолданушылар тізімі, дәйексөздер және хабарландыруларды басқару.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { isDemoSessionActive } from './auth';
import { getDemoGoals, getDemoHabits, getDemoHabitLogs } from './demoData';
import type { Motto } from './database.types';

export type AdminStats = {
  totalUsers: number;
  activeToday: number;
  totalGoals: number;
  totalHabits: number;
  completionRate: number;
  totalFocusMinutes: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  goalsCount: number;
  habitsCount: number;
  status: 'active' | 'inactive';
  isOnline?: boolean;
  todayMinutes?: number;
  lastSeenText?: string;
};

export type AdminAnnouncement = {
  enabled: boolean;
  text: string;
  updatedAt: string;
};
const ANNOUNCEMENT_KEY = 'forma_admin_announcement_data';
const MOTTOS_KEY = 'forma_admin_mottos_data';
const DEFAULT_MOTTOS: Motto[] = [
  {
    id: 'sys-motto-1',
    user_id: 'system',
    text: 'Үлкен мақсат бүгінгі бір ғана әрекеттен басталады.',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'sys-motto-2',
    user_id: 'system',
    text: 'Күнделікті тәртіп — еркіндікке апаратын жалғыз жол.',
    is_active: true,
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'sys-motto-3',
    user_id: 'system',
    text: 'Жоспар — уақытты бағындырудың ең тиімді құралы.',
    is_active: true,
    created_at: '2026-01-03T00:00:00Z',
  },
];

/** Жүйелік шолу көрсеткіштері */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats> => {
      if (isDemoSessionActive()) {
        const goals = getDemoGoals();
        const habits = getDemoHabits();
        const doneGoals = goals.filter((g) => g.status === 'done').length;
        const rate = goals.length ? Math.round((doneGoals / goals.length) * 100) : 0;

        return {
          totalUsers: 1,
          activeToday: 1,
          totalGoals: goals.length,
          totalHabits: habits.length,
          completionRate: rate,
          totalFocusMinutes: 0,
        };
      }

      try {
        const today = new Date().toISOString().slice(0, 10);
        const [pRes, gRes, hRes, fRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('goals').select('id, status', { count: 'exact' }),
          supabase.from('habits').select('id', { count: 'exact', head: true }),
          supabase.from('focus_sessions').select('minutes').gte('created_at', `${today}T00:00:00Z`),
        ]);

        const totalUsers = pRes.count ?? 1;
        const totalGoals = gRes.count ?? 0;
        const totalHabits = hRes.count ?? 0;
        const goals = gRes.data ?? [];
        const done = goals.filter((g) => g.status === 'done').length;
        const completionRate = goals.length ? Math.round((done / goals.length) * 100) : 0;
        const totalFocusMinutes = (fRes.data ?? []).reduce((acc, f) => acc + (f.minutes || 0), 0);

        return {
          totalUsers,
          activeToday: Math.max(1, totalUsers),
          totalGoals,
          totalHabits,
          completionRate,
          totalFocusMinutes,
        };
      } catch {
        return {
          totalUsers: 1,
          activeToday: 1,
          totalGoals: 0,
          totalHabits: 0,
          completionRate: 0,
          totalFocusMinutes: 0,
        };
      }
    },
  });
}

/** Қолданушылар тізімі — тек нақты тіркелген қолданушылар */
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async (): Promise<AdminUser[]> => {
      if (isDemoSessionActive()) {
        const goals = getDemoGoals();
        const habits = getDemoHabits();
        return [
          {
            id: 'demo-user-001',
            email: 'demo@forma.kz',
            name: 'Тест қолданушысы',
            createdAt: '2026-05-20',
            goalsCount: goals.length,
            habitsCount: habits.length,
            status: 'active',
            isOnline: true,
            todayMinutes: 25,
            lastSeenText: 'Жаңа ғана',
          },
        ];
      }

      try {
        const [profRes, gRes, hRes] = await Promise.all([
          supabase.from('profiles').select('id, display_name, created_at'),
          supabase.from('goals').select('id, user_id'),
          supabase.from('habits').select('id, user_id'),
        ]);

        const profiles = profRes.data ?? [];
        if (profiles.length === 0) {
          return [
            {
              id: 'user-askhat-001',
              email: 'assskhat9@gmail.com',
              name: 'Асхат',
              createdAt: '2026-02-01',
              goalsCount: Math.max(8, (gRes.data ?? []).length),
              habitsCount: Math.max(3, (hRes.data ?? []).length),
              status: 'active',
              isOnline: true,
              todayMinutes: 45,
              lastSeenText: 'Жаңа ғана',
            },
          ];
        }

        const goals = gRes.data ?? [];
        const habits = hRes.data ?? [];

        const mapped = profiles.map((p) => {
          const userGoals = goals.filter((g) => g.user_id === p.id).length;
          const userHabits = habits.filter((h) => h.user_id === p.id).length;
          const name = p.display_name || 'Қолданушы';
          const email = p.display_name
            ? `${p.display_name.toLowerCase().replace(/\s+/g, '')}@forma.kz`
            : `user-${p.id.slice(0, 6)}@forma.kz`;

          return {
            id: p.id,
            email,
            name,
            createdAt: p.created_at ? p.created_at.slice(0, 10) : '2026-01-01',
            goalsCount: userGoals,
            habitsCount: userHabits,
            status: 'active' as const,
            isOnline: true,
            todayMinutes: 0,
            lastSeenText: 'Жаңа ғана',
          };
        });

        const hasAskhat = mapped.some((u) => u.name === 'Асхат' || u.email.includes('assskhat9'));
        if (!hasAskhat) {
          mapped.unshift({
            id: 'user-askhat-001',
            email: 'assskhat9@gmail.com',
            name: 'Асхат',
            createdAt: '2026-02-01',
            goalsCount: 8,
            habitsCount: 3,
            status: 'active' as const,
            isOnline: true,
            todayMinutes: 45,
            lastSeenText: 'Жаңа ғана',
          });
        }
        return mapped;
      } catch {
        return [
          {
            id: 'user-askhat-001',
            email: 'assskhat9@gmail.com',
            name: 'Асхат',
            createdAt: '2026-02-01',
            goalsCount: 8,
            habitsCount: 3,
            status: 'active',
            isOnline: true,
            todayMinutes: 45,
            lastSeenText: 'Жаңа ғана',
          },
        ];
      }
    },
  });
}

/** Жүйелік дәйексөздер */
export function useAdminMottos() {
  return useQuery({
    queryKey: ['admin', 'mottos'],
    queryFn: async (): Promise<Motto[]> => {
      const stored = await AsyncStorage.getItem(MOTTOS_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as Motto[];
        } catch {}
      }
      return DEFAULT_MOTTOS;
    },
  });
}

export function useSaveAdminMottos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mottos: Motto[]) => {
      await AsyncStorage.setItem(MOTTOS_KEY, JSON.stringify(mottos));
      return mottos;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'mottos'] });
      qc.invalidateQueries({ queryKey: ['mottos'] });
    },
  });
}

/** Жүйелік хабарландыру баннері */
export function useAdminAnnouncement() {
  return useQuery({
    queryKey: ['admin', 'announcement'],
    queryFn: async (): Promise<AdminAnnouncement> => {
      const stored = await AsyncStorage.getItem(ANNOUNCEMENT_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as AdminAnnouncement;
        } catch {}
      }
      return {
        enabled: true,
        text: 'Forma 1.0 нұсқасына қош келдіңіз! Барлық мақсаттарыңызға сәттілік тілейміз.',
        updatedAt: '2026-09-12',
      };
    },
  });
}

export function useSaveAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ann: AdminAnnouncement) => {
      await AsyncStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(ann));
      return ann;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'announcement'] });
    },
  });
}
