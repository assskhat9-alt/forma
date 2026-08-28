/**
 * Клиенттегі күн есептерінің тесттері.
 *
 * ⚠ Пайыз бен жоспар есебі мұнда ЖОҚ — ол толығымен Postgres жағында
 * (`progress()`, `planned_progress()`). Оларды `npm run verify:db`
 * нақты Postgres көтеріп тексереді, TypeScript көшірмесі ұсталмайды:
 * екі жерде екі есеп тұрса, олар бір күні алшақтап кетеді.
 *
 * Мұнда тек интерфейстің өз логикасы: ай торы мен мерзім нұсқалары.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMonthGrid,
  rowOf,
  collapseOffset,
  weekNumber,
  toISODate,
  termEndDate,
  CELLS,
  COLS,
  PHONE_ROW_HEIGHT,
} from './calendar.ts';

const d = (s: string) => new Date(s + 'T00:00:00');

// ─────────────────────────────────────────────────────────────────────
// Ай торы
// ─────────────────────────────────────────────────────────────────────

test('тор әрқашан 42 ұяшық — ай ауысқанда биіктік секірмейді', () => {
  for (const m of ['2026-01-15', '2026-02-10', '2026-08-28', '2027-03-01']) {
    assert.equal(buildMonthGrid(d(m)).length, CELLS);
  }
});

test('апта дүйсенбіден басталады', () => {
  const cells = buildMonthGrid(d('2026-08-15'));
  // 0 = жексенбі … 1 = дүйсенбі
  assert.equal(cells[0]!.date.getDay(), 1);
});

test('тамыз 2026 — торда 31 күн, қалғаны көрші айдан', () => {
  const cells = buildMonthGrid(d('2026-08-15'));
  assert.equal(cells.filter((c) => !c.outside).length, 31);
  assert.equal(cells.filter((c) => c.outside).length, CELLS - 31);
});

test('бүгінгі күн белгіленеді', () => {
  const cells = buildMonthGrid(d('2026-08-15'), d('2026-08-20'));
  const today = cells.filter((c) => c.isToday);
  assert.equal(today.length, 1);
  assert.equal(today[0]!.date.getDate(), 20);
});

test('көрші айдың күні бүгін болса да сол айдікі емес', () => {
  const cells = buildMonthGrid(d('2026-08-15'));
  const first = cells[0]!;
  // 2026-08-01 — сенбі, сондықтан тор 27 шілдеден басталады
  assert.equal(first.outside, true);
  assert.equal(toISODate(first.date), '2026-07-27');
});

// ─────────────────────────────────────────────────────────────────────
// §7.1 — жиырылу анимациясы
// ─────────────────────────────────────────────────────────────────────

test('таңдалған күннің жолы дұрыс табылады', () => {
  const cells = buildMonthGrid(d('2026-08-15'));
  // 1 тамыз — бірінші жолда (27 шілде – 2 тамыз)
  assert.equal(rowOf(cells, d('2026-08-01')), 0);
  // 3 тамыз — екінші жолда
  assert.equal(rowOf(cells, d('2026-08-03')), 1);
});

test('жиырылу ығысуы жол × 44', () => {
  const cells = buildMonthGrid(d('2026-08-15'));
  assert.equal(collapseOffset(cells, d('2026-08-01')), 0);
  assert.equal(collapseOffset(cells, d('2026-08-03')), -PHONE_ROW_HEIGHT);
  assert.equal(collapseOffset(cells, d('2026-08-10')), -2 * PHONE_ROW_HEIGHT);
});

test('тордың ені жеті баған', () => {
  assert.equal(COLS, 7);
  assert.equal(CELLS % COLS, 0);
});

// ─────────────────────────────────────────────────────────────────────
// Мерзім нұсқалары
// ─────────────────────────────────────────────────────────────────────

test('жылдам мерзім нұсқалары', () => {
  const from = d('2026-08-28');
  assert.equal(toISODate(termEndDate('m3', from)), '2026-11-28');
  assert.equal(toISODate(termEndDate('m6', from)), '2027-02-28');
  assert.equal(toISODate(termEndDate('yearEnd', from)), '2026-12-31');
});

test('«өз күнім» берілген күнді қайтарады', () => {
  assert.equal(
    toISODate(termEndDate('custom', d('2026-08-28'), d('2027-06-01'))),
    '2027-06-01',
  );
});

test('жыл соңы басталу жылымен есептеледі', () => {
  assert.equal(toISODate(termEndDate('yearEnd', d('2027-03-05'))), '2027-12-31');
});

// ─────────────────────────────────────────────────────────────────────
// Көмекшілер
// ─────────────────────────────────────────────────────────────────────

test('ISO апта нөмірі', () => {
  assert.equal(weekNumber(d('2026-08-25')), 35);
});

test('күн Supabase форматында жазылады', () => {
  assert.equal(toISODate(d('2026-01-05')), '2026-01-05');
  assert.equal(toISODate(d('2026-12-31')), '2026-12-31');
});
