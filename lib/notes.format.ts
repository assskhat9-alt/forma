/**
 * Жазбаның ТАЗА есептері — базасыз.
 *
 * ⚠ Бөлек файлда тұрғаны әдейі: осылар тестпен тексеріледі, ал
 * `notes.ts` Supabase клиентін тартады да, тестте оны көтеру керек
 * болар еді. Есеп деректің қайдан келгенін білмеуі тиіс.
 */
// ⚠ Кеңейтімі нақты жазылған: бұл файлды node --test түрлендірусіз
// іске қосады да, кеңейтімсіз жолды таба алмайды.
import { months } from '../i18n/kk.ts';
import type { Note } from './database.types';

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

/** jsonb-дан келген нәрсе сызық тізімі ме — базада ескі пішін жатуы мүмкін */
export function parseStrokes(raw: unknown): Stroke[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter((s): s is Stroke => {
    if (!s || typeof s !== 'object') return false;
    const o = s as Record<string, unknown>;
    return Array.isArray(o.points) && typeof o.color === 'string';
  });
}

// ─────────────────────────────────────────────────────────────────────
// Тізімді топтау — телефондағы «Заметкидегідей»
// ─────────────────────────────────────────────────────────────────────

/** Жазба қашан өзгерген — тізім осы бойынша реттеледі */
export function noteDate(n: Note): Date {
  return new Date(n.updated_at ?? n.created_at);
}

/**
 * Жолдың астындағы қысқа үзінді.
 *
 * ⚠ Тақырып қайталанбауы керек: адам бірінші жолды тақырып ретінде
 * жазса, үзіндіде сол сөз екі рет тұрар еді.
 */
export function notePreview(n: Note): string {
  const body = (n.body ?? '').replace(/\s+/g, ' ').trim();
  if (body) return body;
  return parseStrokes(n.strokes).length > 0 ? '· · ·' : '';
}

/** Бірінші әріпті бас әріпке */
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type Period<T> = { key: string; label: string; items: T[] };

/**
 * Кез келген уақыт таңбасы бар нәрсені кезеңге бөледі: «Соңғы 30 күн»,
 * содан соң айлар. Жаңасы әрқашан жоғарыда.
 *
 * ⚠ Өткен жылдың айына жыл қосылады, әйтпесе «Тамыз» деген екі бөлек
 * топ пайда болып, қайсысы қай жыл екені білінбей қалады.
 *
 * ⚠ Жазба да, апта сабағы да осы бір есепті пайдаланады: екеуі екі
 * түрлі бөлінсе, бір қосымшада екі түрлі уақыт сезімі пайда болар еді.
 */
export function groupByPeriod<T>(
  items: T[],
  dateOf: (x: T) => Date,
  now: Date = new Date(),
): Period<T>[] {
  const recent = new Date(now);
  recent.setDate(recent.getDate() - 30);

  const out: Period<T>[] = [];
  const index = new Map<string, number>();

  const put = (key: string, label: string, x: T) => {
    let i = index.get(key);
    if (i === undefined) {
      i = out.length;
      index.set(key, i);
      out.push({ key, label, items: [] });
    }
    out[i]!.items.push(x);
  };

  for (const x of [...items].sort((a, b) => +dateOf(b) - +dateOf(a))) {
    const d = dateOf(x);
    if (d >= recent) {
      put('recent', 'Соңғы 30 күн', x);
      continue;
    }
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    // ⚠ `months` кіші әріппен басталады («5 тамыз» деп жазу үшін), ал
    // бұл жерде ай — тақырып, сондықтан бас әріпке келтіреміз
    const name = cap(months[d.getMonth()]!);
    const label =
      d.getFullYear() === now.getFullYear() ? name : `${name} ${d.getFullYear()}`;
    put(key, label, x);
  }

  return out;
}

/** Жазбаларды кезеңге бөлу */
export function groupNotes(notes: Note[], now: Date = new Date()) {
  return groupByPeriod(notes, noteDate, now).map((g) => ({
    key: g.key,
    label: g.label,
    notes: g.items,
  }));
}

/**
 * Мәтіннің бірінші жолы — тақырып.
 *
 * ⚠ Телефондағы «Заметкидегідей»: жазбаның бөлек тақырып өрісі жоқ,
 * бірінші жол сол рөлді атқарады. Сондықтан адам ештеңе толтырмайды.
 */
export function firstLine(text: string | null | undefined, max = 60): string {
  const line = (text ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  return line.length > max ? line.slice(0, max - 1).trimEnd() + '…' : line;
}

/** Бірінші жолдан кейінгі қалған мәтін — тізімдегі үзінді */
export function restLine(text: string | null | undefined, max = 80): string {
  const lines = (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  const rest = lines.slice(1).join(' ');
  return rest.length > max ? rest.slice(0, max - 1).trimEnd() + '…' : rest;
}
