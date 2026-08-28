/**
 * Қатені адам оқитын мәтінге айналдыру.
 *
 * ⚠ Supabase қатесі `Error` класының данасы ЕМЕС — ол жай объект:
 * `{ message, details, hint, code }`. Сондықтан `e instanceof Error`
 * тексерісі жаңылып, нақты себеп жасырынып қалады да, экранда
 * пайдасыз «Деректі жүктеу мүмкін болмады» деген сөз тұрады.
 *
 * Мұнда себеп әрқашан көрсетіледі: жасырылған қате — жөндеуге келмейтін қате.
 */
import { kk } from '../i18n/kk';

type SupabaseLikeError = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

/** Postgres қате кодтарының түсінікті аудармасы */
const CODES: Record<string, string> = {
  // Баған жоқ — әдетте миграция қойылмағанын білдіреді
  '42703': 'Дерекқорда бұл баған жоқ. Миграция қойылмаған болуы мүмкін.',
  // Кесте жоқ
  '42P01': 'Дерекқорда бұл кесте жоқ. Миграция қойылмаған.',
  // RLS бөгеді
  '42501': 'Рұқсат жоқ. Қайта кіріп көріңіз.',
  '23505': 'Мұндай жазба әлдеқашан бар.',
  '23503': 'Байланысты жазба табылмады.',
  '23514': 'Мән шектеуге сай емес.',
};

export function errorText(e: unknown): string {
  if (typeof e === 'string' && e.trim()) return e;

  if (e && typeof e === 'object') {
    const err = e as SupabaseLikeError;

    const code = typeof err.code === 'string' ? err.code : null;
    const message = typeof err.message === 'string' ? err.message : null;
    const details = typeof err.details === 'string' ? err.details : null;
    const hint = typeof err.hint === 'string' ? err.hint : null;

    const parts: string[] = [];
    if (code && CODES[code]) parts.push(CODES[code]);
    if (message) parts.push(message);
    else if (details) parts.push(details);
    if (hint) parts.push(hint);

    if (parts.length > 0) return parts.join('\n');
  }

  if (e instanceof Error && e.message) return e.message;

  return kk.common.loadError;
}
