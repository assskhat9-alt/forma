/**
 * React Query клиенті.
 *
 * CLAUDE.md §9: барлық Supabase сұрауы осы арқылы жүреді, queryKey біртізді.
 * Чекбокс басылғанда optimistic update — желі жауабын күтпейді.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Мобильде экран ауысқан сайын қайта сұрау керегі жоқ
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 2,
    },
  },
});

/**
 * queryKey фабрикасы — кілттер бір жерде тұрсын.
 * Мысал: qk.goals.byLevel('year') → ['goals', 'level', 'year']
 */
export const qk = {
  goals: {
    all: ['goals'] as const,
    byLevel: (level: string) => ['goals', 'level', level] as const,
    byId: (id: string) => ['goals', 'id', id] as const,
    children: (parentId: string) => ['goals', 'children', parentId] as const,
    /** progress() RPC — клиентте қайта есептелмейді */
    progress: (id: string) => ['goals', 'progress', id] as const,
    /** planned_progress() RPC — «керек еді» мәні */
    planned: (id: string, onDate: string) => ['goals', 'planned', id, onDate] as const,
  },
  habits: {
    all: ['habits'] as const,
    logs: (from: string, to: string) => ['habits', 'logs', from, to] as const,
  },
  reflections: {
    byGoal: (goalId: string) => ['reflections', 'goal', goalId] as const,
  },
  focus: {
    range: (from: string, to: string) => ['focus', from, to] as const,
  },
  mottos: { all: ['mottos'] as const },
  notes: { all: ['notes'] as const, byId: (id: string) => ['notes', id] as const },
} as const;
