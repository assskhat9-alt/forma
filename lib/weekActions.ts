/**
 * Апта әрекеттерін басқару: көшіру, жабу және тамыр мақсатын анықтау.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { qk } from './query';
import { toISODate } from './calendar';
import { useGoals } from './goals';

/**
 * Әрекетті келесі аптаға көшіру.
 */
export function useMoveAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, date, rootId }: { id: string; date: Date; rootId: string | null }) => {
      const iso = toISODate(date);
      let parentId: string | null = null;

      if (rootId) {
        const { data: month, error: e1 } = await supabase.rpc('month_for_date', {
          p_goal_id: rootId,
          p_date: iso,
        });
        if (e1) throw e1;
        if (!month) throw new Error('Жаңа күн мақсаттың мерзімінен тыс.');
        parentId = month as string;
      }

      const { error } = await supabase
        .from('goals')
        .update(
          parentId
            ? { period_start: iso, period_end: iso, parent_id: parentId }
            : { period_start: iso, period_end: iso },
        )
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

/**
 * Әрекетті жабу.
 *
 * ⚠ Жойылмайды, `dropped` болады: пайыз есебінен шығады, бірақ
 * «мынаны жоспарлағанмын, істемедім» деген факт сақталады.
 */
export function useDropAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'dropped' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals.all }),
  });
}

/** Әрекеттің тамырдағы жылдық мақсатының id-і — көшіргенде ай іздеу үшін */
export function useRootIdOf() {
  const { data: goals } = useGoals();
  const byId = new Map((goals ?? []).map((g) => [g.id, g]));

  return (actionId: string): string | null => {
    let cur = byId.get(actionId);
    const seen = new Set<string>();
    while (cur?.parent_id && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_id);
    }
    // Тамыры өзі болса — бұл жеке шаруа, айға тіркелмейді
    return cur && cur.id !== actionId ? cur.id : null;
  };
}
