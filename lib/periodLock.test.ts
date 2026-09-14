import test from 'node:test';
import assert from 'node:assert/strict';
import { isPastDay, isPeriodExpired, isPlanLocked } from './periodLock.ts';

test('өткен күн 00:00-ден кейін құлыпталған болып саналады', () => {
  const mockNow = new Date(2026, 8, 14, 12, 0, 0); // 2026-09-14
  assert.equal(isPastDay('2026-09-13', mockNow), true);
  assert.equal(isPastDay(new Date(2026, 8, 13, 23, 59, 59), mockNow), true);
});

test('бүгінгі күн 00:00-ге дейін белсенді болады (құлыпталмаған)', () => {
  const mockNow = new Date(2026, 8, 14, 12, 0, 0);
  assert.equal(isPastDay('2026-09-14', mockNow), false);
  assert.equal(isPastDay(new Date(2026, 8, 14, 8, 0, 0), mockNow), false);
});

test('болашақ күн құлыпталмаған', () => {
  const mockNow = new Date(2026, 8, 14, 12, 0, 0);
  assert.equal(isPastDay('2026-09-15', mockNow), false);
  assert.equal(isPastDay(new Date(2026, 8, 15, 0, 0, 0), mockNow), false);
});

test('өткен ай аяқталған соң құлыпталады', () => {
  const mockNow = new Date(2026, 8, 14, 12, 0, 0);
  // 2026 тамыз айы (08)
  assert.equal(isPeriodExpired('month', '2026-08-01', '2026-08-31', mockNow), true);
  // 2026 қыркүйек айы (09) — ағымдағы ай, әлі бітпеген
  assert.equal(isPeriodExpired('month', '2026-09-01', '2026-09-30', mockNow), false);
});

test('өткен жыл аяқталған соң құлыпталады', () => {
  const mockNow = new Date(2026, 8, 14, 12, 0, 0);
  // 2025 жыл
  assert.equal(isPeriodExpired('year', '2025-01-01', '2025-12-31', mockNow), true);
  // 2026 жыл — ағымдағы жыл, әлі бітпеген
  assert.equal(isPeriodExpired('year', '2026-01-01', '2026-12-31', mockNow), false);
});

test('isPlanLocked өткен күндігі орындалмаған жоспарды құлыптайды', () => {
  const mockNow = new Date(2026, 8, 14, 12, 0, 0);
  const pastTask = {
    level: 'day' as const,
    period_start: '2026-09-10',
    status: 'active',
  };
  assert.equal(isPlanLocked(pastTask, mockNow), true);

  const todayTask = {
    level: 'day' as const,
    period_start: '2026-09-14',
    status: 'active',
  };
  assert.equal(isPlanLocked(todayTask, mockNow), false);
});
