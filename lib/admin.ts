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

const INITIAL_USERS: AdminUser[] = [
  {
    id: 'user-001',
    email: 'marat@forma.kz',
    name: 'Марат',
    createdAt: '2026-01-10',
    goalsCount: 12,
    habitsCount: 5,
    status: 'active',
  },
  {
    id: 'user-002',
    email: 'askhat@forma.kz',
    name: 'Асхат',
    createdAt: '2026-02-01',
    goalsCount: 8,
    habitsCount: 3,
    status: 'active',
  },
  {
    id: 'user-003',
    email: 'temirkhan@forma.kz',
    name: 'Темірхан',
    createdAt: '2026-03-15',
    goalsCount: 15,
    habitsCount: 6,
    status: 'active',
  },
  {
    id: 'user-004',
    email: 'demo@forma.kz',
    name: 'Тест қолданушысы',
    createdAt: '2026-05-20',
    goalsCount: 3,
    habitsCount: 2,
    status: 'active',
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
        const rate = goals.length ? Math.round((doneGoals / goals.length) * 100) : 68;

        return {
          totalUsers: INITIAL_USERS.length,
          activeToday: 3,
          totalGoals: goals.length + 24,
          totalHabits: habits.length + 10,
          completionRate: rate || 68,
          totalFocusMinutes: 420,
        };
      }

      try {
        const [pRes, gRes, hRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('goals').select('id, status', { count: 'exact' }),
          supabase.from('habits').select('id', { count: 'exact', head: true }),
        ]);

        const totalUsers = Math.max(pRes.count ?? 0, INITIAL_USERS.length);
        const totalGoals = gRes.count ?? 24;
        const totalHabits = hRes.count ?? 12;
        const goals = gRes.data ?? [];
        const done = goals.filter((g) => g.status === 'done').length;
        const completionRate = goals.length ? Math.round((done / goals.length) * 100) : 72;

        return {
          totalUsers,
          activeToday: Math.max(1, Math.round(totalUsers * 0.4)),
          totalGoals,
          totalHabits,
          completionRate,
          totalFocusMinutes: 650,
        };
      } catch {
        return {
          totalUsers: INITIAL_USERS.length,
          activeToday: 2,
          totalGoals: 28,
          totalHabits: 14,
          completionRate: 70,
          totalFocusMinutes: 380,
        };
      }
    },
  });
}

/** Қолданушылар тізімі */
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async (): Promise<AdminUser[]> => {
      try {
        const { data, error } = await supabase.from('profiles').select('id, display_name, created_at');
        if (error || !data || data.length === 0) return INITIAL_USERS;

        return data.map((p, idx) => ({
          id: p.id,
          email: `${p.display_name?.toLowerCase().replace(/\s+/g, '') || `user${idx + 1}`}@forma.kz`,
          name: p.display_name || `Қолданушы ${idx + 1}`,
          createdAt: p.created_at ? p.created_at.slice(0, 10) : '2026-01-01',
          goalsCount: Math.floor(Math.random() * 10) + 3,
          habitsCount: Math.floor(Math.random() * 5) + 1,
          status: 'active',
        }));
      } catch {
        return INITIAL_USERS;
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
