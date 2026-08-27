/**
 * Прогресс алгоритмі — TypeScript нұсқасы.
 *
 * ⚠ Қосымшадағы АҚИҚАТ КӨЗІ — Postgres функциялары
 * (supabase/migrations/0003_progress.sql). Бұл файл екі нәрсе үшін бар:
 *
 *   1. Алгоритмді тестпен бекіту (progress.test.ts) — SQL-ді тестілеу
 *      қиын, ал ереже бұзылса қосымшаның бүкіл мәні кетеді.
 *   2. «Жаңа мақсат» экранында әлі САҚТАЛМАҒАН жоспарды алдын ала
 *      көрсету — сервер ол туралы білмейді.
 *
 * Экрандарда сақталған мақсаттың пайызын осымен ҚАЙТА ЕСЕПТЕМЕҢІЗ —
 * `goal_stats()` RPC-ін шақырыңыз (CLAUDE.md §5.1).
 */
import { differenceInCalendarDays } from 'date-fns';

export type GoalLevel = 'year' | 'stage' | 'month' | 'week' | 'day';
export type GoalStatus = 'active' | 'done' | 'dropped' | 'paused';

export type GoalNode = {
  id: string;
  level: GoalLevel;
  status: GoalStatus;
  periodStart: Date;
  periodEnd: Date;
  /** Ата-ана ішіндегі салмағы. Нормаланбаған мән — сумма 100 болуы шарт емес. */
  weight: number;
  children?: GoalNode[];
};

/**
 * Күндерді ҚОСА АЛҒАНДА санау.
 * 24.11–24.11 = 1 күн, сол күні кезең 100% өтті деп саналады.
 */
export function inclusiveDays(start: Date, end: Date): number {
  return differenceInCalendarDays(end, start) + 1;
}

/** Бас тартылған балалар есептен мүлде шығады */
function countedChildren(node: GoalNode): GoalNode[] {
  return (node.children ?? []).filter((c) => c.status !== 'dropped');
}

/**
 * НАҚТЫ орындалу, 0–100.
 *
 *   level='day' → status='done' ? 100 : 0
 *   басқасы     → балаларының weight бойынша орташа мәні
 *
 * ⚠ Әдеттер (habit_logs) бұл есепке МҮЛДЕ кірмейді.
 */
export function progress(node: GoalNode): number {
  if (node.level === 'day') {
    return node.status === 'done' ? 100 : 0;
  }

  const kids = countedChildren(node);
  if (kids.length === 0) {
    return node.status === 'done' ? 100 : 0;
  }

  let weightSum = 0;
  let acc = 0;
  for (const c of kids) {
    weightSum += c.weight;
    acc += c.weight * progress(c);
  }

  if (weightSum === 0) {
    return node.status === 'done' ? 100 : 0;
  }
  return round2(acc / weightSum);
}

/**
 * «КЕРЕК ЕДІ» мәні, 0–100.
 *
 * ❌ ҚАТЕ:  (бүгін − басталу) / (мерзім − басталу) × 100
 * ✅ ДҰРЫС: Σ(аяқталған кезеңдердің weight-і)
 *           + ағымдағы_кезең.weight × (кезеңде өткен күн / кезең ұзақтығы)
 *
 * Кезеңі жоқ мақсат үшін ғана сызықтық есеп қалады — басқа амал жоқ.
 */
export function plannedProgress(node: GoalNode, onDate: Date): number {
  const kids = countedChildren(node);

  if (kids.length > 0) {
    const ordered = [...kids].sort(
      (a, b) => a.periodStart.getTime() - b.periodStart.getTime(),
    );

    let weightSum = 0;
    let acc = 0;

    for (const c of ordered) {
      weightSum += c.weight;

      if (differenceInCalendarDays(onDate, c.periodEnd) > 0) {
        // Кезең толық өтті
        acc += c.weight;
      } else if (differenceInCalendarDays(onDate, c.periodStart) >= 0) {
        // Ағымдағы кезең
        const span = inclusiveDays(c.periodStart, c.periodEnd);
        const gone = inclusiveDays(c.periodStart, onDate);
        acc += c.weight * (gone / span);
      }
      // Әлі басталмаған кезең үлес қоспайды
    }

    if (weightSum > 0) return round2((acc / weightSum) * 100);
  }

  return linearProgress(node.periodStart, node.periodEnd, onDate);
}

/**
 * Сызықтық есеп — тек кезеңі ЖОҚ мақсат үшін.
 *
 * Экспортталған себебі: тестте «жалған дабыл» дәл осымен көрсетіледі,
 * әрі «Жаңа мақсат» экраны кезеңсіз жоспарды осылай сызады.
 * Кезеңі бар мақсатқа ҚОЛДАНБАҢЫЗ.
 */
export function linearProgress(start: Date, end: Date, onDate: Date): number {
  const span = inclusiveDays(start, end);
  if (span <= 0) return 0;

  const gone = inclusiveDays(start, onDate);
  if (gone <= 0) return 0;
  if (gone >= span) return 100;

  return round2((gone / span) * 100);
}

/** Оң — алда, теріс — артта */
export function pace(node: GoalNode, onDate: Date): number {
  return round2(progress(node) - plannedProgress(node, onDate));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
