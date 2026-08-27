/**
 * Жоспарлау логикасының тесттері.
 *
 * Мұндағы салмақтар planned_progress() есебінің негізі болады
 * (CLAUDE.md §5.2), сондықтан қате кетсе «керек еді» мәні жалған шығады.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { differenceInCalendarDays } from 'date-fns';

import {
  splitIntoMonths,
  curveWeights,
  buildPlan,
  summarize,
  termEndDate,
} from './plan.ts';

const d = (s: string) => new Date(s + 'T00:00:00');
const iso = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;

// ─────────────────────────────────────────────────────────────────────
// Айларға бөлу
// ─────────────────────────────────────────────────────────────────────

test('26 тамыз – 26 желтоқсан → 5 бөлік', () => {
  const s = splitIntoMonths(d('2026-08-26'), d('2026-12-26'));
  assert.equal(s.length, 5);
  assert.equal(iso(s[0]!.start), '2026-08-26');
  assert.equal(iso(s[0]!.end), '2026-08-31');
  assert.equal(iso(s[4]!.start), '2026-12-01');
  assert.equal(iso(s[4]!.end), '2026-12-26');
});

test('бір ай ішіндегі мерзім — бір бөлік', () => {
  const s = splitIntoMonths(d('2026-08-05'), d('2026-08-20'));
  assert.equal(s.length, 1);
  assert.equal(iso(s[0]!.start), '2026-08-05');
  assert.equal(iso(s[0]!.end), '2026-08-20');
});

test('бір күндік мерзім', () => {
  const s = splitIntoMonths(d('2026-11-24'), d('2026-11-24'));
  assert.equal(s.length, 1);
});

test('кері мерзім — бос', () => {
  assert.equal(splitIntoMonths(d('2026-12-01'), d('2026-08-01')).length, 0);
});

test('бөліктер үзіліссіз жалғасады — саңылау да, қабаттасу да жоқ', () => {
  const s = splitIntoMonths(d('2026-01-15'), d('2026-06-10'));
  for (let i = 1; i < s.length; i++) {
    const prevEnd = s[i - 1]!.end;
    const curStart = s[i]!.start;
    const gap = differenceInCalendarDays(curStart, prevEnd);
    assert.equal(gap, 1, `${iso(prevEnd)} мен ${iso(curStart)} арасы ${gap} күн`);
  }
});

// ─────────────────────────────────────────────────────────────────────
// Қисықтар
// ─────────────────────────────────────────────────────────────────────

test('біркелкі қисық — бәрі тең', () => {
  assert.deepEqual(curveWeights(4, 'even'), [1, 1, 1, 1]);
});

test('«басында» — кемиді', () => {
  const w = curveWeights(5, 'front');
  for (let i = 1; i < w.length; i++) assert.ok(w[i]! < w[i - 1]!);
  assert.equal(w[0], 1.4);
  assert.ok(Math.abs(w[4]! - 0.6) < 1e-9);
});

test('«соңында» — өседі', () => {
  const w = curveWeights(5, 'back');
  for (let i = 1; i < w.length; i++) assert.ok(w[i]! > w[i - 1]!);
  assert.ok(Math.abs(w[0]! - 0.6) < 1e-9);
  assert.equal(w[4], 1.4);
});

test('бір ай — салмағы 1', () => {
  assert.deepEqual(curveWeights(1, 'front'), [1]);
});

// ─────────────────────────────────────────────────────────────────────
// Толық жоспар
// ─────────────────────────────────────────────────────────────────────

test('көлем толық таратылады, жоғалмайды', () => {
  for (const curve of ['even', 'front', 'back'] as const) {
    const plan = buildPlan(d('2026-08-26'), d('2026-12-26'), 80, curve);
    const total = plan.reduce((a, b) => a + b.amount, 0);
    assert.equal(total, 80, `${curve} қисығында сома 80 болмады`);
  }
});

test('біркелкі таратуда айлар шамалас', () => {
  const plan = buildPlan(d('2026-01-01'), d('2026-04-30'), 100, 'even');
  assert.equal(plan.length, 4);
  for (const b of plan) assert.ok(Math.abs(b.amount - 25) <= 1);
});

test('«басында» қисығында бірінші ай соңғысынан үлкен', () => {
  const plan = buildPlan(d('2026-01-01'), d('2026-06-30'), 120, 'front');
  assert.ok(plan[0]!.amount > plan[plan.length - 1]!.amount);
});

test('«соңында» қисығында керісінше', () => {
  const plan = buildPlan(d('2026-01-01'), d('2026-06-30'), 120, 'back');
  assert.ok(plan[0]!.amount < plan[plan.length - 1]!.amount);
});

test('әр бөлікте салмақ оң сан', () => {
  const plan = buildPlan(d('2026-08-26'), d('2026-12-26'), 80, 'front');
  for (const b of plan) assert.ok(b.weight > 0, 'салмақ нөл немесе теріс');
});

// ─────────────────────────────────────────────────────────────────────
// Қорытынды
// ─────────────────────────────────────────────────────────────────────

test('жүргізуші курсының қорытындысы', () => {
  // 26.08 → 26.12 = 123 күн (қоса алғанда)
  const s = summarize(d('2026-08-26'), d('2026-12-26'), 80, 45);
  assert.equal(s.days, 123);
  assert.equal(s.weeks, 18);
  assert.equal(s.perWeek, 4);
});

test('мерзім нұсқалары', () => {
  const from = d('2026-08-26');
  assert.equal(iso(termEndDate('m3', from)), '2026-11-26');
  assert.equal(iso(termEndDate('m6', from)), '2027-02-26');
  assert.equal(iso(termEndDate('yearEnd', from)), '2026-12-31');
  assert.equal(iso(termEndDate('custom', from, d('2027-06-01'))), '2027-06-01');
});
