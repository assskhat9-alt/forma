/**
 * Мотивация — «менің сөзім».
 *
 * ⚠ Жүйе сөз ойлап таппайды және дайын дәйексөз ұсынбайды. Бұл —
 * адамның ӨЗ сөзі: біреудің афоризмі емес, өзіне айтқан уәдесі.
 * Сондықтан тізім бос болса, бос күйінде тұрады.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import type { Motto } from './database.types';

const KEY = ['mottos'] as const;
const PROFILE = ['profile'] as const;

export function useMottos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mottos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Motto[];
    },
  });
}

/** Кезекпен ауысу қосулы ма — аккаунт параметрі */
export function useMottoRotate() {
  return useQuery({
    queryKey: PROFILE,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('motto_rotate')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data?.motto_rotate ?? false;
    },
  });
}

/**
 * Басты бетте тұратын сөз.
 *
 * Кезекпен ауысу қосулы болса — күн бойынша таңдалады: бір күн ішінде
 * сөз өзгермейді, бірақ әр таңда келесісі шығады. Кездейсоқ таңдау
 * емес: бір күні екі рет ашқанда басқа сөз шықса, ол мазалайды.
 */
export function useActiveMotto(now: Date = new Date()) {
  const { data: mottos } = useMottos();
  const { data: rotate } = useMottoRotate();

  const list = mottos ?? [];
  if (list.length === 0) return null;

  if (rotate) {
    const day = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000,
    );
    return list[day % list.length] ?? null;
  }

  return list.find((m) => m.is_active) ?? null;
}

export function useCreateMotto() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { error } = await supabase
        .from('mottos')
        .insert({ user_id: userId, text, is_active: false });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Басты беттегі сөзді таңдау.
 *
 * ⚠ Бір ғана сөз белсенді бола алады: алдымен бәрінен белгі алынады,
 * сосын біреуіне қойылады. Әйтпесе екі сөз қатар «белсенді» болып
 * қалып, қайсысы шығатыны түсініксіз болар еді.
 */
export function useSetActiveMotto() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { error: e1 } = await supabase
        .from('mottos')
        .update({ is_active: false })
        .eq('user_id', userId);
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from('mottos')
        .update({ is_active: true })
        .eq('id', id);
      if (e2) throw e2;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMotto() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mottos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleRotate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (on: boolean) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      // Профиль жолы әлі жоқ болуы мүмкін — сондықтан upsert
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, motto_rotate: on }, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE }),
  });
}
