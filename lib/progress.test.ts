/**
 * Прогресс алгоритмінің тесттері.
 *
 * Іске қосу:  npm test
 *
 * Ең маңызды тест — «жүргізуші куәлігі» (CLAUDE.md §5.2). Ол бұзылса
 * қосымша адамға жалған дабыл бере бастайды, ал бұл — Forma-ның бүкіл
 * мәнін жоққа шығарады.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  progress,
  plannedProgress,
  linearProgress,
  pace,
  inclusiveDays,
  type GoalNode,
} from './progress.ts';

const d = (s: string) => new Date(s + 'T00:00:00');

// ─────────────────────────────────────────────────────────────────────
// CLAUDE.md §5.2 — жүргізуші куәлігі
// ─────────────────────────────────────────────────────────────────────
//
// Курс 26.08 → 26.12. Кезеңдер:
//   курс      40%  26.08–07.11  (аптасына 1 сабақ)
//   дайындық  25%  09.11–22.11  (күнде)
//   тест      10%  24.11        (бекітілген)
//   вождение  25%  25.11–22.12

function drivingCourse(): GoalNode {
  const stage = (
    id: string,
    from: string,
    to: string,
    weight: number,
  ): GoalNode => ({
    id,
    level: 'stage',
    status: 'active',
    periodStart: d(from),
    periodEnd: d(to),
    weight,
  });

  return {
    id: 'driving',
    level: 'year',
    status: 'active',
    periodStart: d('2026-08-26'),
    periodEnd: d('2026-12-26'),
    weight: 1,
    children: [
      stage('kurs', '2026-08-26', '2026-11-07', 40),
      stage('dayindyq', '2026-11-09', '2026-11-22', 25),
      stage('test', '2026-11-24', '2026-11-24', 10),
      stage('vozhdenie', '2026-11-25', '2026-12-22', 25),
    ],
  };
}

test('§5.2 — 7 қарашада жоспар 40% болуы керек', () => {
  const goal = drivingCourse();
  assert.equal(plannedProgress(goal, d('2026-11-07')), 40);
});

test('§5.2 — сызықтық есеп сол күні 60% береді, яғни ЖАЛҒАН', () => {
  const goal = drivingCourse();
  const naive = linearProgress(goal.periodStart, goal.periodEnd, d('2026-11-07'));

  // Мақсат осы: екеуі БІРДЕЙ БОЛМАУЫ керек
  assert.ok(Math.round(naive) === 60, `сызықтық есеп ${naive}, күтілгені 60`);
  assert.notEqual(Math.round(naive), plannedProgress(goal, d('2026-11-07')));
});

test('кезеңдер арасындағы саңылауда жоспар өспейді', () => {
  const goal = drivingCourse();
  // 08.11 — курс бітті, дайындық әлі басталған жоқ
  assert.equal(plannedProgress(goal, d('2026-11-08')), 40);
});

test('бір күндік бекітілген кезең сол күні толық есептеледі', () => {
  const goal = drivingCourse();
  // курс 40 + дайындық 25 + тест 10 = 75
  assert.equal(plannedProgress(goal, d('2026-11-24')), 75);
});

test('басталмаған мақсаттың жоспары 0', () => {
  const goal = drivingCourse();
  assert.equal(plannedProgress(goal, d('2026-08-01')), 0);
});

test('мерзім өткенде жоспар 100', () => {
  const goal = drivingCourse();
  assert.equal(plannedProgress(goal, d('2026-12-31')), 100);
});

// ─────────────────────────────────────────────────────────────────────
// §5.1 — нақты орындалу
// ─────────────────────────────────────────────────────────────────────

function day(id: string, done: boolean, weight = 1): GoalNode {
  return {
    id,
    level: 'day',
    status: done ? 'done' : 'active',
    periodStart: d('2026-08-25'),
    periodEnd: d('2026-08-25'),
    weight,
  };
}

test('күндік тапсырма — 100 немесе 0', () => {
  assert.equal(progress(day('a', true)), 100);
  assert.equal(progress(day('b', false)), 0);
});

test('ата-ана — балаларының weight бойынша орташасы', () => {
  const week: GoalNode = {
    id: 'w',
    level: 'week',
    status: 'active',
    periodStart: d('2026-08-24'),
    periodEnd: d('2026-08-30'),
    weight: 1,
    children: [day('d1', true), day('d2', true), day('d3', false), day('d4', false)],
  };
  assert.equal(progress(week), 50);
});

test('weight есепке алынады — тең емес салмақ тең емес үлес береді', () => {
  const week: GoalNode = {
    id: 'w',
    level: 'week',
    status: 'active',
    periodStart: d('2026-08-24'),
    periodEnd: d('2026-08-30'),
    weight: 1,
    children: [day('big', true, 3), day('small', false, 1)],
  };
  // 3×100 + 1×0 = 300 / 4 = 75
  assert.equal(progress(week), 75);
});

test('dropped бала есептен мүлде шығады', () => {
  const week: GoalNode = {
    id: 'w',
    level: 'week',
    status: 'active',
    periodStart: d('2026-08-24'),
    periodEnd: d('2026-08-30'),
    weight: 1,
    children: [
      day('done', true),
      { ...day('gone', false), status: 'dropped' as const },
    ],
  };
  // Бас тартылғаны болмаса — қалғаны 100%
  assert.equal(progress(week), 100);
});

test('каскад үш деңгейге дейін жиналады', () => {
  const year: GoalNode = {
    id: 'y',
    level: 'year',
    status: 'active',
    periodStart: d('2026-01-01'),
    periodEnd: d('2026-12-31'),
    weight: 1,
    children: [
      {
        id: 'm1',
        level: 'month',
        status: 'active',
        periodStart: d('2026-08-01'),
        periodEnd: d('2026-08-31'),
        weight: 1,
        children: [day('a', true), day('b', false)],
      },
      {
        id: 'm2',
        level: 'month',
        status: 'active',
        periodStart: d('2026-09-01'),
        periodEnd: d('2026-09-30'),
        weight: 1,
        children: [day('c', true), day('e', true)],
      },
    ],
  };
  // (50 + 100) / 2 = 75
  assert.equal(progress(year), 75);
});

// ─────────────────────────────────────────────────────────────────────
// pace
// ─────────────────────────────────────────────────────────────────────

test('pace — оң болса алда, теріс болса артта', () => {
  const goal = drivingCourse();
  // Ешқандай бала орындалмаған, сондықтан progress = 0
  assert.equal(pace(goal, d('2026-11-07')), -40);
});

// ─────────────────────────────────────────────────────────────────────
// күн санау
// ─────────────────────────────────────────────────────────────────────

test('күндер қоса алғанда саналады', () => {
  assert.equal(inclusiveDays(d('2026-11-24'), d('2026-11-24')), 1);
  assert.equal(inclusiveDays(d('2026-08-26'), d('2026-11-07')), 74);
  assert.equal(inclusiveDays(d('2026-08-26'), d('2026-12-26')), 123);
});
