/**
 * Сессия басқаруы.
 *
 * Supabase сессияны өзі сақтайды (мобильде AsyncStorage, вебте
 * localStorage), біз тек оны React контекстіне шығарамыз және
 * қорғалған маршруттарды бақылаймыз.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';

import { supabase } from './supabase';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_USER_ID } from './demoData';

const DEMO_STORAGE_KEY = 'forma_demo_mode_active';

let gDemoActive = false;

export function isDemoSessionActive(): boolean {
  return gDemoActive;
}

export const DEMO_SESSION: Session = {
  access_token: 'demo-token',
  token_type: 'bearer',
  expires_in: 3600 * 24 * 365,
  refresh_token: 'demo-refresh',
  user: {
    id: DEMO_USER_ID,
    app_metadata: { provider: 'demo' },
    user_metadata: { full_name: 'Тест қолданушысы' },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    email: 'demo@forma.kz',
  },
};

type SessionState = {
  session: Session | null;
  /** Бірінші тексеріс аяқталды ма — оған дейін ештеңе көрсетпейміз */
  ready: boolean;
  isDemo: boolean;
  enterDemoMode: () => Promise<void>;
  leaveDemoMode: () => Promise<void>;
};

const Ctx = createContext<SessionState>({
  session: null,
  ready: false,
  isDemo: false,
  enterDemoMode: async () => {},
  leaveDemoMode: async () => {},
});

export function useSession() {
  return useContext(Ctx);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    AsyncStorage.getItem(DEMO_STORAGE_KEY).then((val) => {
      if (!alive) return;
      if (val === 'true') {
        gDemoActive = true;
        setIsDemo(true);
        setSession(DEMO_SESSION);
        setReady(true);
        return;
      }

      supabase.auth.getSession().then(({ data }) => {
        if (!alive) return;
        setSession(data.session);
        setReady(true);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      AsyncStorage.getItem(DEMO_STORAGE_KEY).then((val) => {
        if (!alive) return;
        if (val === 'true') {
          gDemoActive = true;
          setIsDemo(true);
          setSession(DEMO_SESSION);
        } else {
          gDemoActive = false;
          setIsDemo(false);
          setSession(next);
        }
        setReady(true);
      });
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const enterDemoMode = async () => {
    await AsyncStorage.setItem(DEMO_STORAGE_KEY, 'true');
    gDemoActive = true;
    setIsDemo(true);
    setSession(DEMO_SESSION);
  };

  const leaveDemoMode = async () => {
    await AsyncStorage.removeItem(DEMO_STORAGE_KEY);
    gDemoActive = false;
    setIsDemo(false);
    setSession(null);
    await supabase.auth.signOut().catch(() => {});
  };

  const value = useMemo(
    () => ({ session, ready, isDemo, enterDemoMode, leaveDemoMode }),
    [session, ready, isDemo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Кірмеген адамды кіру экранына, кірген адамды қосымшаға жібереді.
 * Түбірлік layout ішінде бір рет шақырылады.
 */
export function useProtectedRoute() {
  const { session, ready } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, ready, segments, router]);
}
