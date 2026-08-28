/**
 * Ырғақ есебінің тесттері.
 *
 * ⚠ Мұндағы басты тексеріс — жүйе ЕШТЕҢЕНІ ӨЗГЕРТПЕЙДІ (CLAUDE.md §5.2a).
 * `computeRhythm` кірістегі `amount` пен `perWeek` мәндерін қайтармайды,
 * оларға тимейді. Ол тек «егер осылай істесеңіз, мынау болады» дейді.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { computeRhythm, weeksBetween, weekDaysMatchRhythm } from './rhythm.ts';

const d = (s: string) => new Date(s + 'T00:00:00');
const iso = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;

// ─────────────────────────────────────────────────────────────────────
// Негізгі есеп
// ─────────────────────────────────────────────────────────────────────

test('80 сабақ, аптасына 2 → 40 апта керек', () => {
  const r = computeRhythm({
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: null,
  });
  assert.equal(r.weeksNeeded, 40);
});

test('40 аптадан кейінгі бітетін күн', () => {
  const r = computeRhythm({
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: null,
  });
  // 28.08.2026 + 40 апта − 1 күн
  assert.equal(iso(r.finishDate), '2027-06-03');
});

test('бөлінбейтін сан жоғары дөңгелектенеді', () => {
  // 10 әрекет, аптасына 3 → 4 апта (3+3+3+1)
  const r = computeRhythm({ amount: 10, perWeek: 3, start: d('2026-01-01'), deadline: null });
  assert.equal(r.weeksNeeded, 4);
});

test('ырғақ қойылмаса есеп жүрмейді', () => {
  const r = computeRhythm({ amount: 80, perWeek: 0, start: d('2026-08-28'), deadline: null });
  assert.equal(r.weeksNeeded, 0);
  assert.equal(r.fits, true);
  assert.equal(r.options.perWeekToFit, null);
});

// ─────────────────────────────────────────────────────────────────────
// Мерзімнен асу — §5.2a-дағы ескерту
// ─────────────────────────────────────────────────────────────────────

test('мерзімге сыймаса — қанша апта асқаны есептеледі', () => {
  // 28.08.2026 → 31.12.2026 = 126 күн = дәл 18 апта.
  // Ырғақ 40 апта сұрайды → 22 апта асып тұр.
  // ⚠ Дәл осы «22 апта» CLAUDE.md §5.2a-дағы мысалмен сәйкес келеді.
  const r = computeRhythm({
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  });
  assert.equal(r.fits, false);
  assert.equal(r.weeksAvailable, 18);
  assert.equal(r.weeksOver, 22);
});

test('сыйып тұрса ескерту жоқ', () => {
  const r = computeRhythm({
    amount: 80,
    perWeek: 5,
    start: d('2026-08-28'),
    deadline: d('2027-12-31'),
  });
  assert.equal(r.fits, true);
  assert.equal(r.weeksOver, 0);
  assert.equal(r.options.perWeekToFit, null);
  assert.equal(r.options.amountToFit, null);
});

test('дәл мерзімге сыйғанда да ескерту жоқ', () => {
  // 10 апта керек, 10 апта бар
  const r = computeRhythm({
    amount: 20,
    perWeek: 2,
    start: d('2026-01-01'),
    deadline: d('2026-03-11'), // 70 күн = 10 апта
  });
  assert.equal(r.weeksNeeded, 10);
  assert.equal(r.weeksAvailable, 10);
  assert.equal(r.fits, true);
});

// ─────────────────────────────────────────────────────────────────────
// Үш шешім — ешқайсысы автоматты қолданылмайды
// ─────────────────────────────────────────────────────────────────────

test('«аптасына N рет» — мерзімге сыятын ырғақ', () => {
  const r = computeRhythm({
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  });
  // 80 / 18 апта = 4,4 → 5
  assert.equal(r.options.perWeekToFit, 5);
});

test('«мерзімді жылжыту» — ағымдағы ырғақтың бітетін күні', () => {
  const r = computeRhythm({
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  });
  assert.equal(iso(r.options.moveDeadlineTo), iso(r.finishDate));
});

test('«көлемді азайту» — мерзімге сыятын көлем', () => {
  const r = computeRhythm({
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  });
  // 18 апта × аптасына 2 = 36
  assert.equal(r.options.amountToFit, 36);
});

test('ұсынылған ырғақ шынымен сыяды', () => {
  const first = computeRhythm({
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  });
  // Адам «аптасына 5» батырмасын басты дейік
  const after = computeRhythm({
    amount: 80,
    perWeek: first.options.perWeekToFit!,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  });
  assert.equal(after.fits, true);
});

test('ұсынылған көлем шынымен сыяды', () => {
  const first = computeRhythm({
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  });
  const after = computeRhythm({
    amount: first.options.amountToFit!,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  });
  assert.equal(after.fits, true);
});

// ─────────────────────────────────────────────────────────────────────
// ЖҮЙЕ ЕШТЕҢЕНІ ӨЗГЕРТПЕЙДІ
// ─────────────────────────────────────────────────────────────────────

test('есеп кірістегі мәндерді өзгертпейді', () => {
  const input = {
    amount: 80,
    perWeek: 2,
    start: d('2026-08-28'),
    deadline: d('2026-12-31'),
  };
  const snapshot = { ...input, start: iso(input.start), deadline: iso(input.deadline) };

  computeRhythm(input);

  assert.equal(input.amount, snapshot.amount);
  assert.equal(input.perWeek, snapshot.perWeek);
  assert.equal(iso(input.start), snapshot.start);
  assert.equal(iso(input.deadline), snapshot.deadline);
});

test('нәтижеде «ұсынылған ырғақ» деген дайын мән жоқ — тек салдар', () => {
  const r = computeRhythm({ amount: 80, perWeek: 2, start: d('2026-08-28'), deadline: null });
  // Мерзім жоқ болса ұсыныс та жоқ
  assert.equal(r.options.perWeekToFit, null);
  assert.equal(r.options.amountToFit, null);
});

// ─────────────────────────────────────────────────────────────────────
// Көмекшілер
// ─────────────────────────────────────────────────────────────────────

test('апта саны толық емес аптаны да қосады', () => {
  assert.equal(weeksBetween(d('2026-01-01'), d('2026-01-07')), 1);
  assert.equal(weeksBetween(d('2026-01-01'), d('2026-01-08')), 2);
  assert.equal(weeksBetween(d('2026-01-01'), d('2026-01-01')), 1);
});

test('өткен мерзім нөл апта береді', () => {
  assert.equal(weeksBetween(d('2026-06-01'), d('2026-01-01')), 0);
});

test('апта күндері ырғақпен сәйкестігі — тек хабарлама', () => {
  assert.equal(weekDaysMatchRhythm([1, 3], 2), true);
  assert.equal(weekDaysMatchRhythm([1, 3, 5], 2), false);
  // Күн таңдалмаса тексерілмейді
  assert.equal(weekDaysMatchRhythm([], 2), true);
});
