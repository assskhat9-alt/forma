/**
 * Мақсатты айларға тарату.
 *
 * «Жаңа мақсат» экранында адам мерзім мен көлемді таңдайды, ал жүйе
 * жүктемені айларға өзі бөледі. Сол бөлу нәтижесі `goals` кестесіне
 * level='month' жолдары болып жазылады, ал олардың `weight` мәні
 * planned_progress() есебінің НЕГІЗІ болады (CLAUDE.md §5.2).
 *
 * Сондықтан бұл жердегі салмақтар дұрыс болмаса, «керек еді» мәні де
 * қате шығады. Тесті: lib/plan.test.ts
 */
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInCalendarDays,
  isBefore,
  isAfter,
} from 'date-fns';

/** Тарату қисығы — макеттегі үш нұсқа */
export type Curve = 'even' | 'front' | 'back';

export type MonthBucket = {
  /** Айдың басы (немесе мақсаттың басталу күні, егер ай ортасында басталса) */
  start: Date;
  /** Айдың соңы (немесе мерзім күні) */
  end: Date;
  /** Ата-ана ішіндегі салмағы — planned_progress() осыны қолданады */
  weight: number;
  /** Осы айға тиесілі көлем, дана */
  amount: number;
  /** Ай нөмірі 0–11 — атауын шығару үшін */
  monthIndex: number;
  year: number;
};

/**
 * Мерзімді күнтізбелік айларға бөледі.
 * Шеттегі толымсыз айлар да кіреді: 26 тамыз – 26 желтоқсан → 5 бөлік.
 */
export function splitIntoMonths(start: Date, end: Date): { start: Date; end: Date }[] {
  if (isAfter(atMidnight(start), atMidnight(end))) return [];

  const from = atMidnight(start);
  const to = atMidnight(end);

  const out: { start: Date; end: Date }[] = [];
  let cursor = startOfMonth(from);

  // 600 ай — 50 жыл, шексіз циклден қорғау
  for (let i = 0; i < 600; i++) {
    const mStart = i === 0 ? from : cursor;
    // ⚠ endOfMonth 23:59:59.999 қайтарады. Күнді сақтағанда бұл маңызды
    // емес, бірақ күндерді салыстырғанда шатастырады — түн ортасына
    // теңестіреміз.
    const mEnd = atMidnight(endOfMonth(cursor));
    const sliceEnd = isBefore(to, mEnd) ? to : mEnd;

    out.push({ start: mStart, end: sliceEnd });

    if (!isBefore(sliceEnd, to)) break;
    cursor = startOfMonth(addMonths(cursor, 1));
  }

  return out;
}

/** Уақытын алып тастап, тек күнді қалдырады */
function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Қисық бойынша салмақ.
 *
 *   even  — бәрі бірдей
 *   front — басында қарқынды, соңына қарай баяулайды (1.4 → 0.6)
 *   back  — басында баяу, соңына қарай күшейеді (0.6 → 1.4)
 *
 * Мәндер MaqsatQosu.dc.html макетінен алынған.
 */
export function curveWeights(n: number, curve: Curve): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];

  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 → 1
    if (curve === 'even') out.push(1);
    else if (curve === 'front') out.push(1.4 - t * 0.8);
    else out.push(0.6 + t * 0.8);
  }
  return out;
}

/**
 * Толық жоспар: айлар, салмақтар және әр айға тиесілі көлем.
 *
 * ⚠ Салмақ күн санына ЕМЕС, қисыққа қарай беріледі. Толымсыз ай да
 * толық айдай салмақ алады — өйткені адам «тамызда 16 сабақ» деп
 * жоспарлайды, «тамыздың алты күнінде 3 сабақ» деп емес.
 */
export function buildPlan(
  start: Date,
  end: Date,
  totalAmount: number,
  curve: Curve,
): MonthBucket[] {
  const slices = splitIntoMonths(start, end);
  if (slices.length === 0) return [];

  const weights = curveWeights(slices.length, curve);
  const sum = weights.reduce((a, b) => a + b, 0);

  // Дөңгелектеу кезінде жалпы сома жоғалмасын: соңғысына қалдықты береміз
  const raw = weights.map((w) => (w / sum) * totalAmount);
  const amounts = raw.map((v) => Math.round(v));
  const drift = totalAmount - amounts.reduce((a, b) => a + b, 0);
  if (amounts.length > 0) amounts[amounts.length - 1]! += drift;

  return slices.map((s, i) => ({
    start: s.start,
    end: s.end,
    weight: Math.round(weights[i]! * 1000) / 1000,
    amount: amounts[i]!,
    monthIndex: s.start.getMonth(),
    year: s.start.getFullYear(),
  }));
}

export type PlanSummary = {
  days: number;
  weeks: number;
  months: number;
  /** Аптасына қанша дана */
  perWeek: number;
  /** Күніне шамамен неше минут */
  perDayMinutes: number;
};

/**
 * Жоспардың қысқаша қорытындысы — экранның жоғарғы бөлігі үшін.
 * `minutesPerUnit` — бір дананың шамамен ұзақтығы (макетте 45 мин).
 */
export function summarize(
  start: Date,
  end: Date,
  totalAmount: number,
  minutesPerUnit: number,
): PlanSummary {
  const days = differenceInCalendarDays(end, start) + 1;
  const weeks = Math.max(Math.round(days / 7), 1);
  const months = Math.max(Math.round(days / 30.4), 1);
  const perWeek = Math.max(Math.round(totalAmount / weeks), 1);
  const perDayMinutes = Math.round((perWeek * minutesPerUnit) / 7);

  return { days, weeks, months, perWeek, perDayMinutes };
}

/** Мерзім нұсқалары — макеттегі төрт чип */
export type TermKey = 'm3' | 'm6' | 'yearEnd' | 'custom';

export function termEndDate(key: TermKey, from: Date, custom?: Date): Date {
  switch (key) {
    case 'm3':
      return addMonths(from, 3);
    case 'm6':
      return addMonths(from, 6);
    case 'yearEnd':
      return new Date(from.getFullYear(), 11, 31);
    case 'custom':
      return custom ?? addMonths(from, 12);
  }
}
