/**
 * Supabase кестелерінің типтері.
 *
 * Қолмен жазылған. Supabase CLI қосылғаннан кейін мынамен ауыстырыңыз:
 *   npx supabase gen types typescript --project-id <id> > lib/database.types.ts
 */

export type GoalLevel = 'year' | 'stage' | 'month' | 'week' | 'day';
export type GoalStatus = 'active' | 'done' | 'dropped' | 'paused';
export type FocusSource = 'timer' | 'manual';

/** {"type":"daily"} немесе {"type":"weekly","days":[1,3,5]} — 1=дүйсенбі */
export type HabitSchedule =
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] };

/** [{tool,color,width,opacity,points:[[x,y],…]}] */
export type Stroke = {
  tool: 'pen' | 'marker' | 'eraser';
  color: string;
  width: number;
  opacity: number;
  points: [number, number][];
};

export type Goal = {
  id: string;
  user_id: string;
  parent_id: string | null;
  level: GoalLevel;
  title: string;
  note: string | null;
  /** `YYYY-MM-DD` */
  period_start: string;
  /** `YYYY-MM-DD`. level='year' болса бұл — мерзім (deadline) */
  period_end: string;
  weight: number;
  target_amount: number | null;
  unit: string | null;
  locked: boolean;
  status: GoalStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  timezone: string;
  motto_rotate: boolean;
  created_at: string;
};

export type Reflection = {
  id: string;
  user_id: string;
  goal_id: string | null;
  body: string | null;
  /** 1=Қиын 2=Орташа 3=Жақсы 4=Керемет */
  rating: number | null;
  minutes_spent: number | null;
  created_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  title: string;
  schedule: HabitSchedule;
  color: string;
  archived_at: string | null;
  sort_order: number;
  created_at: string;
};

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  minutes: number | null;
};

export type FocusSession = {
  id: string;
  user_id: string;
  goal_id: string | null;
  habit_id: string | null;
  started_at: string | null;
  minutes: number;
  source: FocusSource;
  created_at: string;
};

export type Motto = {
  id: string;
  user_id: string;
  text: string;
  is_active: boolean;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  title: string | null;
  body: string | null;
  strokes: Stroke[] | null;
  goal_id: string | null;
  created_at: string;
  updated_at: string;
};

/** goal_stats() RPC қайтаратын жол */
export type GoalStats = {
  actual: number;
  planned: number;
  gap: number;
};

// supabase-js `Relationships` кілтін талап етеді — онсыз бүкіл Database
// типі танылмай, RPC аргументтері `undefined`-қа айналады.
type Row<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Row<Profile>;
      goals: Row<Goal>;
      reflections: Row<Reflection>;
      habits: Row<Habit>;
      habit_logs: Row<HabitLog>;
      focus_sessions: Row<FocusSession>;
      mottos: Row<Motto>;
      notes: Row<Note>;
    };
    Views: Record<string, never>;
    Functions: {
      progress: { Args: { p_goal_id: string }; Returns: number };
      planned_progress: {
        Args: { p_goal_id: string; p_on_date?: string };
        Returns: number;
      };
      pace: { Args: { p_goal_id: string; p_on_date?: string }; Returns: number };
      goal_stats: {
        Args: { p_goal_id: string; p_on_date?: string };
        Returns: GoalStats[];
      };
      habit_streak: { Args: { p_habit_id: string; p_today?: string }; Returns: number };
      habit_consistency: {
        Args: { p_habit_id: string; p_today?: string };
        Returns: number;
      };
    };
    Enums: {
      goal_level: GoalLevel;
      goal_status: GoalStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
