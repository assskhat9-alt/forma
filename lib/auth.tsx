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

type SessionState = {
  session: Session | null;
  /** Бірінші тексеріс аяқталды ма — оған дейін ештеңе көрсетпейміз */
  ready: boolean;
};

const Ctx = createContext<SessionState>({ session: null, ready: false });

export function useSession() {
  return useContext(Ctx);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, ready }), [session, ready]);
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
