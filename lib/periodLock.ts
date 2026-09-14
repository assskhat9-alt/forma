/**
 * Уақыттық құлыптау ережесі (Time & Period Lock).
 *
 * ЕРЕЖЕ:
 * Егер сол күндегі / айдағы / жылдағы жоспар орындалды деп белгіленбесе,
 * келесі күні (00:00-ден кейін) немесе мерзім аяқталған соң оны өзгертуге,
 * өткен мерзім үшін «орындалды» деп белгілеуге болмайды.
 */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Берілген күн өткен күн бе (00:00-ден кейін жабылған ба)
 */
export function isPastDay(dateStrOrDate: string | Date, now: Date = new Date()): boolean {
  const targetIso = typeof dateStrOrDate === 'string'
    ? dateStrOrDate.slice(0, 10)
    : toISODate(dateStrOrDate);
  const todayIso = toISODate(now);
  return targetIso < todayIso;
}

/**
 * Кезең (күн, ай немесе жыл) аяқталды ма
 */
export function isPeriodExpired(
  level: 'day' | 'week' | 'month' | 'year',
  startIso: string,
  endIso?: string | null,
  now: Date = new Date(),
): boolean {
  const todayIso = toISODate(now);
  if (level === 'day') {
    return startIso.slice(0, 10) < todayIso;
  }
  const effectiveEnd = (endIso ?? startIso).slice(0, 10);
  return effectiveEnd < todayIso;
}

/**
 * Жоспар/тапсырма мерзімі өтіп, өзгертуге жабылған ба
 */
export function isPlanLocked(
  plan: {
    level: 'day' | 'week' | 'month' | 'year';
    period_start: string;
    period_end?: string | null;
    status?: string;
  },
  now: Date = new Date(),
): boolean {
  return isPeriodExpired(plan.level, plan.period_start, plan.period_end, now);
}
