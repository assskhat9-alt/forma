/**
 * Жазба тізімінің есептері.
 *
 * ⚠ Мұнда база жоқ: топтау мен үзінді таза функция. Supabase-пен
 * жұмысты бұл тест тексермейді.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  groupNotes, noteDate, notePreview, parseStrokes, firstLine, restLine,
} from './notes.format.ts';
import type { Note } from './database.types.ts';

const NOW = new Date('2026-08-30T12:00:00');

/** Тексеріске жететін ең аз жазба */
function note(p: Partial<Note> & { id: string; updated_at: string }): Note {
  return {
    body: null,
    created_at: p.updated_at,
    strokes: [],
    title: null,
    user_id: 'u',
    ...p,
  } as Note;
}

// ─────────────────────────────────────────────────────────────────────
// Топтау
// ─────────────────────────────────────────────────────────────────────

test('соңғы 30 күн бір топқа жиналады', () => {
  const g = groupNotes(
    [
      note({ id: 'a', updated_at: '2026-08-29T10:00:00' }),
      note({ id: 'b', updated_at: '2026-08-05T10:00:00' }),
    ],
    NOW,
  );

  assert.equal(g.length, 1);
  assert.equal(g[0]!.key, 'recent');
  assert.deepEqual(g[0]!.notes.map((n) => n.id), ['a', 'b']);
});

test('30 күннен әрі — ай бойынша бөлінеді', () => {
  const g = groupNotes(
    [
      note({ id: 'жаңа', updated_at: '2026-08-20T10:00:00' }),
      note({ id: 'маусым', updated_at: '2026-06-10T10:00:00' }),
      note({ id: 'сәуір', updated_at: '2026-04-02T10:00:00' }),
    ],
    NOW,
  );

  assert.deepEqual(g.map((x) => x.label), ['Соңғы 30 күн', 'Маусым', 'Сәуір']);
});

test('өткен жылдың айына жыл қосылады', () => {
  const g = groupNotes([note({ id: 'a', updated_at: '2025-08-10T10:00:00' })], NOW);
  assert.equal(g[0]!.label, 'Тамыз 2025');
});

test('бір айдың екі жазбасы бір топта, жаңасы жоғарыда', () => {
  const g = groupNotes(
    [
      note({ id: 'ескі', updated_at: '2026-06-01T10:00:00' }),
      note({ id: 'жаңа', updated_at: '2026-06-28T10:00:00' }),
    ],
    NOW,
  );

  assert.equal(g.length, 1);
  assert.deepEqual(g[0]!.notes.map((n) => n.id), ['жаңа', 'ескі']);
});

test('жазба жоқ болса, топ та жоқ', () => {
  assert.deepEqual(groupNotes([], NOW), []);
});

// ─────────────────────────────────────────────────────────────────────
// Үзінді мен күн
// ─────────────────────────────────────────────────────────────────────

test('үзінді — мәтіннің басы, жол ауысулары бір бос орынға айналады', () => {
  const n = note({ id: 'a', updated_at: '2026-08-29T10:00:00', body: ' бірінші\n\nекінші ' });
  assert.equal(notePreview(n), 'бірінші екінші');
});

test('мәтін жоқ, сурет бар болса — нүктелер', () => {
  const n = note({
    id: 'a',
    updated_at: '2026-08-29T10:00:00',
    body: '   ',
    strokes: [{ tool: 'pen', color: '#000', width: 2, opacity: 1, points: [[0, 0]] }],
  });
  assert.equal(notePreview(n), '· · ·');
});

test('мәтін де, сурет те жоқ болса — үзінді бос', () => {
  assert.equal(notePreview(note({ id: 'a', updated_at: '2026-08-29T10:00:00' })), '');
});

// ⚠ Типте updated_at міндетті, бірақ базада NOT NULL емес: ескі
// жолдарда ол бос болуы мүмкін, сондықтан қорғаныс тексеріледі
test('updated_at жоқ болса, created_at алынады', () => {
  const n = {
    ...note({ id: 'a', updated_at: '2026-08-29T10:00:00' }),
    updated_at: null,
  } as unknown as Note;
  assert.equal(noteDate(n).toISOString(), new Date('2026-08-29T10:00:00').toISOString());
});

test('базадан келген қоқыс сызық болып саналмайды', () => {
  assert.deepEqual(parseStrokes(null), []);
  assert.deepEqual(parseStrokes([{ color: '#000' }, 7, null]), []);
  assert.equal(parseStrokes([{ color: '#000', points: [] }]).length, 1);
});

// ─────────────────────────────────────────────────────────────────────
// Бірінші жол — тақырып
// ─────────────────────────────────────────────────────────────────────

test('бірінші жол тақырып болады, бос жолдар аттап кетіледі', () => {
  assert.equal(firstLine('\n\n  Сәуірге жоспар  \nҚарыздан құтылу'), 'Сәуірге жоспар');
});

test('ұзын тақырып қысқарады', () => {
  assert.equal(firstLine('абвгдеёжзи', 6), 'абвгд…');
});

test('мәтін бос болса, тақырып та бос', () => {
  assert.equal(firstLine(''), '');
  assert.equal(firstLine(null), '');
});

test('үзінді — бірінші жолдан КЕЙІНГІ мәтін', () => {
  assert.equal(restLine('Тақырып\nбірінші\nекінші'), 'бірінші екінші');
});

test('бір ғана жол болса, үзінді бос — тақырып қайталанбайды', () => {
  assert.equal(restLine('Тақырып'), '');
});
