/**
 * Миграцияларды НАҚТЫ Postgres-те тексереді.
 *
 * Supabase-тің SQL Editor-іне соқыр қоймас бұрын осыны іске қосыңыз:
 * синтаксис қатесі де, есептеу қатесі де осында шығады.
 *
 *   npm i --no-save embedded-postgres
 *   node scripts/verify-migrations.mjs
 *
 * embedded-postgres әдейі package.json-ға қосылмаған: ол ~100 МБ
 * бинарник тартады, ал ол әр `npm install` кезінде керек емес.
 */
import EmbeddedPostgres from 'embedded-postgres';
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, '.pgdata-verify');
const migrations = join(root, 'supabase', 'migrations');

/**
 * Supabase `auth` схемасының макеті.
 * Нақты жобада бұл Supabase-тің өзінде бар — біз тек миграцияларымыз
 * оған дұрыс сүйенетінін тексереміз.
 */
const AUTH_STUB = `
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- Ағымдағы қолданушыны сессия айнымалысынан алады
create or replace function auth.uid() returns uuid
language sql stable as $fn$
  select nullif(current_setting('forma.test_uid', true), '')::uuid
$fn$;
`;

function sql(name) {
  return readFileSync(join(migrations, name), 'utf8');
}

const ok = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  console.error(`  ✗ ${m}`);
  process.exitCode = 1;
};

if (existsSync(dataDir)) rmSync(dataDir, { recursive: true, force: true });

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'verify',
  port: 54329,
  persistent: false,
});

console.log('Postgres іске қосылуда…');
await pg.initialise();
await pg.start();

// ⚠ Windows-та кластер әдепкіде WIN1251 болып құрылады, ал қазақ әріптері
// оған сыймайды (ғ, ұ, ә…). Supabase әрқашан UTF8 — тест БД-сын да
// солай құрамыз, әйтпесе жалған қате шығады.
const admin = pg.getPgClient();
await admin.connect();
await admin.query(
  `create database forma_verify
     encoding 'UTF8' lc_collate 'C' lc_ctype 'C' template template0`,
);
await admin.end();

const client = new Client({
  host: 'localhost',
  port: 54329,
  user: 'postgres',
  password: 'verify',
  database: 'forma_verify',
});
await client.connect();

try {
  console.log('\nМиграциялар:');

  await client.query('create extension if not exists "pgcrypto"');
  await client.query(AUTH_STUB);
  ok('auth схемасының макеті');

  for (const f of ['0001_schema.sql', '0002_rls.sql', '0003_progress.sql']) {
    await client.query(sql(f));
    ok(f);
  }

  // ── Екінші рет: файлдар қайта іске қосуға төзімді ме ──
  console.log('\nҚайта іске қосу:');
  for (const f of ['0001_schema.sql', '0002_rls.sql', '0003_progress.sql']) {
    await client.query(sql(f));
    ok(`${f} — екінші рет те өтті`);
  }

  // ── §5.2 жүргізуші куәлігі: SQL нұсқасы TS нұсқасымен сәйкес пе ──
  console.log('\n§5.2 — жүргізуші куәлігі:');

  const { rows: [user] } = await client.query(
    `insert into auth.users (email) values ('test@forma.kz') returning id`,
  );
  const uid = user.id;

  const goal = async (parent, level, title, from, to, weight) => {
    const { rows: [r] } = await client.query(
      `insert into goals (user_id, parent_id, level, title, period_start, period_end, weight)
       values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [uid, parent, level, title, from, to, weight],
    );
    return r.id;
  };

  const course = await goal(null, 'year', 'Жүргізуші куәлігі', '2026-08-26', '2026-12-26', 1);
  await goal(course, 'stage', 'Курс', '2026-08-26', '2026-11-07', 40);
  await goal(course, 'stage', 'Дайындық', '2026-11-09', '2026-11-22', 25);
  await goal(course, 'stage', 'Тест', '2026-11-24', '2026-11-24', 10);
  await goal(course, 'stage', 'Вождение', '2026-11-25', '2026-12-22', 25);

  const planned = async (d) => {
    const { rows: [r] } = await client.query(
      'select planned_progress($1, $2::date) as v',
      [course, d],
    );
    return Number(r.v);
  };

  const cases = [
    ['2026-11-07', 40, '7 қарашада жоспар 40% (уақыт бойынша 60% болар еді)'],
    ['2026-11-08', 40, 'кезеңдер саңылауында жоспар өспейді'],
    ['2026-11-24', 75, 'бір күндік бекітілген кезең толық есептеледі'],
    ['2026-08-01', 0, 'басталмаған мақсаттың жоспары 0'],
    ['2026-12-31', 100, 'мерзім өткенде 100'],
  ];

  for (const [date, want, label] of cases) {
    const got = await planned(date);
    if (got === want) ok(`${label} → ${got}%`);
    else fail(`${label}: күтілгені ${want}%, шыққаны ${got}%`);
  }

  // ── §5.1 progress: балалардың weight бойынша орташасы ──
  console.log('\n§5.1 — нақты орындалу:');

  const week = await goal(course, 'week', '34-апта', '2026-08-24', '2026-08-30', 1);
  const d1 = await goal(week, 'day', 'Тапсырма 1', '2026-08-25', '2026-08-25', 1);
  await goal(week, 'day', 'Тапсырма 2', '2026-08-26', '2026-08-26', 1);

  const progressOf = async (id) => {
    const { rows: [r] } = await client.query('select progress($1) as v', [id]);
    return Number(r.v);
  };

  if ((await progressOf(week)) === 0) ok('ештеңе орындалмағанда 0%');
  else fail('бос апта 0% болуы керек еді');

  await client.query(`update goals set status='done' where id=$1`, [d1]);
  if ((await progressOf(week)) === 50) ok('екеудің бірі орындалғанда 50%');
  else fail(`жарты апта 50% болуы керек еді, шыққаны ${await progressOf(week)}%`);

  // ── Әдеттер пайызға араласпайтынын тексеру ──
  console.log('\nӘдеттер бөлек екенін тексеру:');

  const { rows: [habit] } = await client.query(
    `insert into habits (user_id, title) values ($1,'Ерте тұру') returning id`,
    [uid],
  );
  for (const d of ['2026-08-23', '2026-08-24', '2026-08-25']) {
    await client.query(
      'insert into habit_logs (user_id, habit_id, log_date) values ($1,$2,$3)',
      [uid, habit.id, d],
    );
  }

  const before = await progressOf(course);
  const { rows: [s] } = await client.query('select habit_streak($1, $2::date) as v', [
    habit.id, '2026-08-25',
  ]);
  const after = await progressOf(course);

  if (Number(s.v) === 3) ok('серия 3 күн');
  else fail(`серия 3 болуы керек еді, шыққаны ${s.v}`);

  if (before === after) ok('әдет белгілері мақсат пайызын ҚОЗҒАМАДЫ');
  else fail(`әдеттер пайызға әсер етті: ${before} → ${after}`);

  // ── RLS шынымен қосулы ма ──
  console.log('\nRLS:');
  const { rows: rls } = await client.query(`
    select tablename, rowsecurity from pg_tables
    where schemaname='public' order by tablename
  `);
  const off = rls.filter((r) => !r.rowsecurity).map((r) => r.tablename);
  if (off.length === 0) ok(`барлық ${rls.length} кестеде RLS қосулы`);
  else fail(`RLS қосылмаған кестелер: ${off.join(', ')}`);

  const { rows: pol } = await client.query(
    `select count(*)::int as n from pg_policies where schemaname='public'`,
  );
  // profiles 3 + 7 кесте × 4 = 31
  if (pol[0].n === 31) ok(`${pol[0].n} саясат құрылды`);
  else fail(`31 саясат күтілген еді, шыққаны ${pol[0].n}`);

} catch (e) {
  console.error('\nҚАТЕ:', e.message);
  if (e.position) console.error('позиция:', e.position);
  process.exitCode = 1;
} finally {
  await client.end();
  await pg.stop();
  if (existsSync(dataDir)) rmSync(dataDir, { recursive: true, force: true });
}

console.log(
  process.exitCode
    ? '\nМиграцияларда мәселе бар — Supabase-ке қоймаңыз.'
    : '\nБәрі дұрыс. Миграцияларды Supabase-ке қоюға болады.',
);
