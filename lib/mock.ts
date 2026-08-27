/**
 * ⚠ УАҚЫТША ДЕРЕК КӨЗІ — 1-фазада Supabase сұрауларына ауысады.
 *
 * Мұндағы типтер `goals` кестесінің нақты пішінімен сәйкес, ал функциялар
 * болашақ `useQuery` хуктарымен бірдей мән қайтарады. Сондықтан ауыстыру
 * осы бір файлды алмастырумен шектеледі — экран коды өзгермейді.
 *
 * CLAUDE.md §10.3 бойынша «дайын» саналуы үшін бұл файл жойылуы керек.
 */
import { toISODate } from './calendar';

/** Мақсаттың түс шкаласы — тамырдағы жылдық мақсаттың реті бойынша */
export type GoalRef = {
  id: string;
  title: string;
  color: string;
};

export type DayTask = {
  id: string;
  title: string;
  /** `null` — «уақытсыз» тапсырма */
  time: string | null;
  goal: GoalRef;
  done: boolean;
};

/** Календарь ұяшығындағы жүктеме белгісі */
export type DayLoad = {
  total: number;
  done: number;
  /** Ұяшықта көрсетілетін мақсат түстері (телефонда нүкте, планшетте чип) */
  items: { title: string; color: string }[];
};

const SHADES = ['#7A6CF0', '#8B7DF3', '#9A8DF5', '#AA9EF7', '#BDB4FA'];

export const MOCK_GOALS: GoalRef[] = [
  { id: 'g1', title: 'Ағылшын C1', color: SHADES[0]! },
  { id: 'g2', title: 'Жеке жоба', color: SHADES[1]! },
  { id: 'g3', title: 'Дене · 78 кг', color: SHADES[2]! },
  { id: 'g4', title: '12 кітап', color: SHADES[3]! },
];

/** Тамыз 2026 — макеттегі жүктеме картасымен бірдей */
const PLAN: Record<number, { t: string; g: number; time: string | null; done?: boolean }[]> = {
  3: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: 'Жүгіру 5 км', g: 2, time: '06:30' }],
  4: [{ t: '20 бет оқу', g: 3, time: '21:00' }, { t: 'Зал', g: 2, time: '18:00' }, { t: 'Auth модулі', g: 1, time: '14:00' }],
  5: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }],
  6: [{ t: 'Жүгіру 5 км', g: 2, time: '06:30' }, { t: '20 бет оқу', g: 3, time: '21:00' }],
  7: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }],
  10: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: 'Зал', g: 2, time: '18:00' }, { t: '20 бет оқу', g: 3, time: '21:00' }],
  11: [{ t: 'Жүгіру 5 км', g: 2, time: '06:30' }, { t: 'Auth тесттері', g: 1, time: '14:00' }],
  12: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: '20 бет оқу', g: 3, time: '21:00' }],
  13: [{ t: 'Зал', g: 2, time: '18:00' }, { t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }],
  14: [{ t: '20 бет оқу', g: 3, time: '21:00' }],
  17: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: 'Жүгіру 5 км', g: 2, time: '06:30' }, { t: '20 бет оқу', g: 3, time: '21:00' }],
  18: [{ t: 'Зал', g: 2, time: '18:00' }, { t: 'Профиль экраны', g: 1, time: '14:00' }],
  19: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: '20 бет оқу', g: 3, time: '21:00' }],
  20: [{ t: 'Жүгіру 5 км', g: 2, time: '06:30' }],
  21: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: 'Зал', g: 2, time: '18:00' }],
  24: [{ t: 'Жүгіру 5 км', g: 2, time: '06:30' }, { t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: '20 бет оқу', g: 3, time: '21:00' }],
  25: [
    { t: 'Таңғы жаттығу — 5 км', g: 2, time: '06:30', done: true },
    { t: 'Ағылшын тыңдалым, 45 мин', g: 0, time: '08:00', done: true },
    { t: 'Жобаның авторизациясы', g: 1, time: '14:00' },
    { t: '20 бет оқу', g: 3, time: '21:00' },
  ],
  26: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: 'Зал', g: 2, time: '18:00' }],
  27: [{ t: '20 бет оқу', g: 3, time: '21:00' }, { t: 'Auth API', g: 1, time: '14:00' }, { t: 'Жүгіру 5 км', g: 2, time: '06:30' }],
  28: [{ t: 'Тыңдалым, 45 мин', g: 0, time: '08:00' }, { t: 'Зал', g: 2, time: '18:00' }],
  31: [{ t: '20 бет оқу', g: 3, time: '21:00' }],
};

/** Макеттегі «бүгін» — 25 тамыз 2026 */
export const MOCK_TODAY = new Date(2026, 7, 25);

const AUGUST_2026 = { year: 2026, month: 7 };

function isMockMonth(d: Date) {
  return d.getFullYear() === AUGUST_2026.year && d.getMonth() === AUGUST_2026.month;
}

/** Бір күннің тапсырмалары */
export function tasksForDay(date: Date, overrides: Record<string, boolean> = {}): DayTask[] {
  if (!isMockMonth(date)) return [];
  const raw = PLAN[date.getDate()];
  if (!raw) return [];

  const iso = toISODate(date);
  return raw.map((r, i) => {
    const id = `${iso}-${i}`;
    return {
      id,
      title: r.t,
      time: r.time,
      goal: MOCK_GOALS[r.g]!,
      done: overrides[id] ?? r.done ?? false,
    };
  });
}

/** Календарь ұяшығының жүктемесі */
export function loadForDay(date: Date, overrides: Record<string, boolean> = {}): DayLoad | null {
  const tasks = tasksForDay(date, overrides);
  if (tasks.length === 0) return null;
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.done).length,
    items: tasks.map((t) => ({ title: t.goal.title, color: t.goal.color })),
  };
}
