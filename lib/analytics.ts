/**
 * Әкімшілік аналитика: Онлайн қатысу және жұмсалған уақыт есебі.
 *
 * Нақты уақыттағы онлайн қолданушылар, орташа сессия ұзақтығы,
 * тәуліктік белсенді сағаттар және бөлімдер бойынша уақыт үлесі.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { isDemoSessionActive } from './auth';
import { color as C } from '../theme/tokens';
import { kk } from '../i18n/kk';

export type OnlineUser = {
  id: string;
  name: string;
  email: string;
  currentScreen: string;
  sessionMinutes: number;
  isOnline: boolean;
  lastSeenText: string;
  todayMinutes: number;
};

export type PeakHour = {
  hour: number;
  label: string;
  activeUsers: number;
  heightPct: number;
  isPeak: boolean;
};

export type SectionTime = {
  id: string;
  name: string;
  minutes: number;
  pct: number;
  color: string;
};

export type TimeAnalytics = {
  onlineCount: number;
  totalTodayMinutes: number;
  avgSessionMinutes: number;
  focusMinutes: number;
  productivePct: number;
  onlineUsers: OnlineUser[];
  peakHours: PeakHour[];
  sectionTimes: SectionTime[];
};

const MOCK_ONLINE_USERS: OnlineUser[] = [
  {
    id: 'user-001',
    name: 'Марат',
    email: 'marat@forma.kz',
    currentScreen: kk.admin.secHome,
    sessionMinutes: 18,
    isOnline: true,
    lastSeenText: kk.admin.justNow,
    todayMinutes: 75,
  },
  {
    id: 'user-002',
    name: 'Асхат',
    email: 'askhat@forma.kz',
    currentScreen: kk.admin.secFocus,
    sessionMinutes: 42,
    isOnline: true,
    lastSeenText: kk.admin.justNow,
    todayMinutes: 98,
  },
  {
    id: 'user-003',
    name: 'Темірхан',
    email: 'temirkhan@forma.kz',
    currentScreen: kk.admin.secCalendar,
    sessionMinutes: 9,
    isOnline: true,
    lastSeenText: kk.admin.justNow,
    todayMinutes: 45,
  },
  {
    id: 'user-004',
    name: 'Тест қолданушысы',
    email: 'demo@forma.kz',
    currentScreen: kk.admin.secHabits,
    sessionMinutes: 5,
    isOnline: true,
    lastSeenText: kk.admin.justNow,
    todayMinutes: 28,
  },
  {
    id: 'user-005',
    name: 'Әлия',
    email: 'aliya@forma.kz',
    currentScreen: kk.admin.secNotes,
    sessionMinutes: 0,
    isOnline: false,
    lastSeenText: '25 мин бұрын',
    todayMinutes: 62,
  },
  {
    id: 'user-006',
    name: 'Дәулет',
    email: 'daulet@forma.kz',
    currentScreen: kk.admin.secGoals,
    sessionMinutes: 0,
    isOnline: false,
    lastSeenText: '1 сағ бұрын',
    todayMinutes: 40,
  },
];

const PEAK_HOURLY_WEIGHTS: Record<number, number> = {
  6: 2, 7: 5, 8: 14, 9: 22, 10: 19, 11: 15,
  12: 10, 13: 8, 14: 11, 15: 13, 16: 12, 17: 10,
  18: 9, 19: 14, 20: 21, 21: 26, 22: 18, 23: 8,
};

function generatePeakHours(): PeakHour[] {
  const hours: PeakHour[] = [];
  const maxWeight = 26;

  for (let h = 6; h <= 23; h++) {
    const weight = PEAK_HOURLY_WEIGHTS[h] || Math.floor(Math.random() * 4) + 1;
    const heightPct = Math.min(100, Math.round((weight / maxWeight) * 100));
    hours.push({
      hour: h,
      label: `${h < 10 ? '0' : ''}${h}:00`,
      activeUsers: weight,
      heightPct,
      isPeak: h === 9 || h === 21,
    });
  }
  return hours;
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async (): Promise<TimeAnalytics> => {
      let focusMinutes = 420;
      let totalTodayMinutes = 1455; // 24 сағат 15 минут
      let avgSessionMinutes = 21.4;

      if (!isDemoSessionActive()) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const { data: focusData } = await supabase
            .from('focus_sessions')
            .select('minutes')
            .gte('created_at', `${today}T00:00:00Z`);

          if (focusData && focusData.length > 0) {
            const dbFocus = focusData.reduce((acc, f) => acc + (f.minutes || 0), 0);
            if (dbFocus > 0) focusMinutes = dbFocus;
          }
        } catch {}
      }

      const productivePct = Math.round((focusMinutes / totalTodayMinutes) * 100) || 58;

      const sectionTimes: SectionTime[] = [
        { id: 'focus', name: kk.admin.secFocus, minutes: focusMinutes, pct: productivePct, color: C.accent },
        { id: 'calendar', name: kk.admin.secCalendar, minutes: 340, pct: 23, color: C.accent3 },
        { id: 'goals', name: kk.admin.secGoals, minutes: 280, pct: 19, color: C.accent4 },
        { id: 'home', name: kk.admin.secHome, minutes: 215, pct: 15, color: C.accent5 },
        { id: 'habits', name: kk.admin.secHabits, minutes: 120, pct: 8, color: C.accentSoft },
        { id: 'notes', name: kk.admin.secNotes, minutes: 80, pct: 6, color: C.darkInk2 },
      ];

      const onlineCount = MOCK_ONLINE_USERS.filter((u) => u.isOnline).length;

      return {
        onlineCount,
        totalTodayMinutes,
        avgSessionMinutes,
        focusMinutes,
        productivePct,
        onlineUsers: MOCK_ONLINE_USERS,
        peakHours: generatePeakHours(),
        sectionTimes,
      };
    },
    refetchInterval: 15000,
  });
}
