/**
 * Календарь есептері — таза функциялар, UI-ға тәуелсіз.
 *
 * Апта ДҮЙСЕНБІДЕН басталады (CLAUDE.md §9).
 * Тор әрқашан 6 жол × 7 баған = 42 ұяшық: ай ауысқанда тордың биіктігі
 * секірмеуі керек, әйтпесе §7.1-дегі жиырылу анимациясы бұзылады.
 */
import {
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  isSameDay,
  isSameMonth,
  getISOWeek,
  format,
} from 'date-fns';

export const ROWS = 6;
export const COLS = 7;
export const CELLS = ROWS * COLS;

/** Телефондағы тор жолының биіктігі — §7.1 анимациясы осыған сүйенеді */
export const PHONE_ROW_HEIGHT = 44;
/** Ашық тор: 6 × 44 = 264 */
export const PHONE_GRID_OPEN = ROWS * PHONE_ROW_HEIGHT;
/** Жиырылған тор: бір ғана жол + сәл орын */
export const PHONE_GRID_COLLAPSED = 46;

export type DayCell = {
  date: Date;
  /** Айдың нақты күні ме, әлде көрші айдан ба */
  outside: boolean;
  isToday: boolean;
};

/**
 * Дүйсенбіден басталатын 42 ұяшықты тор құрады.
 * `anchor` — көрсетілетін айдың кез келген күні.
 */
export function buildMonthGrid(anchor: Date, today: Date = new Date()): DayCell[] {
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });

  const cells: DayCell[] = [];
  for (let i = 0; i < CELLS; i++) {
    const date = addDays(gridStart, i);
    cells.push({
      date,
      outside: !isSameMonth(date, first),
      isToday: isSameDay(date, today),
    });
  }
  return cells;
}

/** Таңдалған күн тордың нешінші жолында тұр (0-ден бастап) */
export function rowOf(cells: DayCell[], date: Date): number {
  const idx = cells.findIndex((c) => !c.outside && isSameDay(c.date, date));
  return idx < 0 ? 0 : Math.floor(idx / COLS);
}

/** §7.1: жиырылғанда тор таңдалған жолға дейін жоғары жылжиды */
export function collapseOffset(cells: DayCell[], date: Date): number {
  return -rowOf(cells, date) * PHONE_ROW_HEIGHT;
}

export function nextMonth(anchor: Date): Date {
  return addMonths(anchor, 1);
}

export function prevMonth(anchor: Date): Date {
  return addMonths(anchor, -1);
}

/** ISO апта нөмірі — «34-апта» деген жазулар үшін */
export function weekNumber(date: Date): number {
  return getISOWeek(date);
}

/** `2026-08-25` — Supabase `date` бағанының форматы */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Күндер бірдей ме — тізімді сүзу үшін */
export { isSameDay };
