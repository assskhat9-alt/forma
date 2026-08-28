/**
 * Ырғақтың САЛДАРЫН есептеу.
 *
 * ⚠ CLAUDE.md §5.2a — ЖҮЙЕ ЖОСПАРДЫ ӨЗІ ҚҰРМАЙДЫ.
 *
 *   ❌ БҰРЫН: мерзім + көлем → жүйе аптасына нешеу керегін ӨЗІ шешеді
 *   ✅ ЖАҢА:  көлем + ырғақ (адам қояды) → жүйе қашан бітетінін КӨРСЕТЕДІ
 *
 * Жүйе — калькулятор, автопилот емес. Мұндағы ешбір функция ештеңені
 * өзгертпейді: тек санайды және қайшылықты сипаттайды. Шешімді адам
 * қабылдайды, ол батырманы басқанда ғана тиісті өріс өзгереді.
 *
 * Жүйе адамның өмірін білмейді: автомектепте тек сенбіде орын бар
 * екенін, сейсенбіде жұмыс кеш бітетінін білмейді.
 */
import { addDays, differenceInCalendarDays } from 'date-fns';

export type RhythmInput = {
  /** Қанша әрекет керек — 80 сабақ */
  amount: number;
  /** Аптасына неше рет — АДАМ қояды */
  perWeek: number;
  start: Date;
  /** Ата-ана мақсаттың мерзімі. Жоқ болса шектеу де жоқ. */
  deadline: Date | null;
};

export type RhythmOptions = {
  /**
   * Мерзімге сыю үшін аптасына қанша керек болар еді.
   * `null` — мерзім жоқ немесе әлдеқашан сыйып тұр.
   */
  perWeekToFit: number | null;
  /** Ағымдағы ырғақпен мерзім қай күнге жылжуы керек */
  moveDeadlineTo: Date;
  /** Ағымдағы ырғақпен мерзімге сыятын көлем */
  amountToFit: number | null;
};

export type RhythmResult = {
  /** Ырғақ бойынша қанша апта керек */
  weeksNeeded: number;
  /** Сол ырғақпен қай күні бітеді */
  finishDate: Date;
  /** Мерзімге дейін қанша апта бар. Мерзім жоқ болса `null`. */
  weeksAvailable: number | null;
  /** Мерзімнен неше апта асып тұр. 0 — сыйып тұр. */
  weeksOver: number;
  fits: boolean;
  options: RhythmOptions;
};

/** Күндерді ҚОСА АЛҒАНДА санау: 1 қаңтар – 1 қаңтар = 1 күн */
function inclusiveDays(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from) + 1;
}

/**
 * Ырғақтың салдары.
 *
 * Ештеңе өзгертпейді — тек есептейді. `options` ішіндегі мәндер
 * ұсыныс емес, «егер осыны таңдасаңыз, мынау болады» деген есеп.
 */
export function computeRhythm(input: RhythmInput): RhythmResult {
  const { amount, perWeek, start, deadline } = input;

  const safeAmount = Math.max(Math.floor(amount) || 0, 0);
  const safePerWeek = Math.max(Math.floor(perWeek) || 0, 0);

  // Ырғақ қойылмаса есептейтін ештеңе жоқ
  if (safeAmount === 0 || safePerWeek === 0) {
    return {
      weeksNeeded: 0,
      finishDate: start,
      weeksAvailable: deadline ? weeksBetween(start, deadline) : null,
      weeksOver: 0,
      fits: true,
      options: {
        perWeekToFit: null,
        moveDeadlineTo: start,
        amountToFit: null,
      },
    };
  }

  const weeksNeeded = Math.ceil(safeAmount / safePerWeek);
  // Соңғы аптаның соңғы күні: N апта = N×7 күн, бірақ бірінші күн де саналады
  const finishDate = addDays(start, weeksNeeded * 7 - 1);

  if (!deadline) {
    return {
      weeksNeeded,
      finishDate,
      weeksAvailable: null,
      weeksOver: 0,
      fits: true,
      options: { perWeekToFit: null, moveDeadlineTo: finishDate, amountToFit: null },
    };
  }

  const weeksAvailable = weeksBetween(start, deadline);
  const weeksOver = Math.max(weeksNeeded - weeksAvailable, 0);
  const fits = weeksOver === 0;

  return {
    weeksNeeded,
    finishDate,
    weeksAvailable,
    weeksOver,
    fits,
    options: {
      // Мерзімге сыю үшін ырғақ қаншаға көтерілуі керек
      perWeekToFit:
        fits || weeksAvailable <= 0 ? null : Math.ceil(safeAmount / weeksAvailable),
      // Ағымдағы ырғақпен мерзім қай күнге жылжиды
      moveDeadlineTo: finishDate,
      // Ағымдағы ырғақпен мерзімге дейін неше әрекет сыяды
      amountToFit: fits ? null : Math.max(weeksAvailable * safePerWeek, 1),
    },
  };
}

/** Екі күн арасында толық емес аптаны да қоса алғанда неше апта бар */
export function weeksBetween(from: Date, to: Date): number {
  const days = inclusiveDays(from, to);
  return days <= 0 ? 0 : Math.ceil(days / 7);
}

/**
 * Апта күндерінен ырғақ туындамайды: екеуін де АДАМ қояды (§5.2b).
 * Бұл функция тек «таңдалған күндер саны ырғақпен сәйкес пе» дегенді
 * айтады — түзетпейді, ескертпейді, жай ғана хабарлайды.
 */
export function weekDaysMatchRhythm(weekDays: number[], perWeek: number): boolean {
  if (weekDays.length === 0 || perWeek <= 0) return true;
  return weekDays.length === perWeek;
}
