/**
 * Менің ойларым — жазба мен сурет.
 *
 * ⚠ Бұл жерде пайыз да, мерзім де, «орындалды» да жоқ. Ой — есеп
 * берілетін нәрсе емес. Сондықтан жазба мақсатқа міндетті түрде
 * байланбайды: қаласаңыз байлайсыз, қаламасаңыз — жеке бет.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';
import type { Note } from './database.types';

const KEY = ['notes'] as const;

/**
 * Бір сызық.
 *
 * Схемадағы пішін: {tool,color,width,opacity,points:[[x,y],…]}.
 * Құрал типі де сақталады — маркердің мөлдірлігі мен қаламның
 * қалыңдығы кейін ашқанда сол күйінде тұруы керек.
 */
export type Stroke = {
  tool: 'pen' | 'marker';
  color: string;
  width: number;
  opacity: number;
  points: [number, number][];
};

export function useNotes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (n: { title: string; body: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) throw new Error('Сессия жоқ');

      const { data, error } = await supabase
        .from('notes')
        .insert({ user_id: userId, title: n.title, body: n.body, strokes: [] })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSaveNote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (n: {
      id: string;
      title: string;
      body: string;
      strokes: Stroke[];
    }) => {
      const { error } = await supabase
        .from('notes')
        .update({
          title: n.title,
          body: n.body,
          strokes: n.strokes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', n.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** jsonb-дан келген нәрсе сызық тізімі ме — базада ескі пішін жатуы мүмкін */
export function parseStrokes(raw: unknown): Stroke[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter((s): s is Stroke => {
    if (!s || typeof s !== 'object') return false;
    const o = s as Record<string, unknown>;
    return Array.isArray(o.points) && typeof o.color === 'string';
  });
}
