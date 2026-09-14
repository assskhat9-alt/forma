/**
 * Апта сабақтары мен рефлексиялардың деректер қабаты.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { addDays } from './report';

export function useWeekLesson(from: Date, to: Date) {
  return useQuery({
    queryKey: ['weekLesson', from.toISOString()],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .is('goal_id', null)
        .gte('created_at', from.toISOString())
        .lt('created_at', addDays(to, 1).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data ?? [])[0] ?? null;
    },
  });
}

export function useWeekLessons(limit = 60) {
  return useQuery({
    queryKey: ['weekLessons', limit],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('reflections')
        .select('id, body, created_at')
        .eq('user_id', userId)
        .is('goal_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as { id: string; body: string | null; created_at: string }[];
    },
  });
}

export function useSaveWeekLesson() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      { id, body, at }: { id: string | null; body: string; at: Date },
    ): Promise<{ id: string }> => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      if (id) {
        const { error } = await supabase
          .from('reflections')
          .update({ body })
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return { id };
      }

      const { data, error } = await supabase
        .from('reflections')
        .insert({
          user_id: userId,
          goal_id: null,
          body,
          rating: null,
          minutes_spent: null,
          created_at: at.toISOString(),
        })
        .select('id')
        .single();
      if (error) throw error;
      return { id: data.id as string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekLesson'] });
      qc.invalidateQueries({ queryKey: ['weekLessons'] });
      qc.invalidateQueries({ queryKey: ['reflections', 'all'] });
    },
  });
}

export function useDeleteWeekLesson() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { error } = await supabase
        .from('reflections')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekLesson'] });
      qc.invalidateQueries({ queryKey: ['weekLessons'] });
      qc.invalidateQueries({ queryKey: ['reflections', 'all'] });
    },
  });
}
