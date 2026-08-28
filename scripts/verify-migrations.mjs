/**
 * Миграцияларды НАҚТЫ Postgres-те тексереді.
 *
 * Supabase-тің SQL Editor-іне соқыр қоймас бұрын осыны іске қосыңыз:
 * синтаксис қатесі де, есептеу қатесі де осында шығады.
 *
 *   npm i --no-save embedded-postgres
 *   npm run verify:db
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

const FILES = [
  '0001_schema.sql',
  '0002_rls.sql',
  '0003_progress.sql',
  '0004_result.sql',
  '0005_rhythm.sql',
  '0006_time_skeleton.sql',
];

/** Supabase `auth` схемасының макеті */
const AUTH_STUB = `
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

create or replace function auth.uid() returns uuid
language sql stable as $fn$
  select nullif(current_setting('forma.test_uid', true), '')::uuid
$fn$;
`;

const sql = (name) => readFileSync(join(migrations, name), 'utf8');
const ok = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  console.error(`  ✗ ${m}`);
  process.exitCode = 1;
};
const eq = (got, want, label) =>
  got === want ? ok(`${label} → ${got}`) : fail(`${label}: күтілгені ${want}, шыққаны ${got}`);

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

// ⚠ Windows-та кластер әдепкіде WIN1251 болып құрылады, қазақ әріптері
// оған сыймайды. Supabase әрқашан UTF8.
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

const one = async (q, p = []) => (await client.query(q, p)).rows[0];

try {
  console.log('\nМиграциялар:');
  await client.query('create extension if not exists "pgcrypto"');
  await client.query(AUTH_STUB);
  ok('auth схемасының макеті');

  for (const f of FILES) {
    await client.query(sql(f));
    ok(f);
  }

  console.log('\nҚайта іске қосу:');
  for (const f of FILES) {
    await client.query(sql(f));
    ok(`${f} — екінші рет те өтті`);
  }

  // ── Ескі модель толық жойылды ма ──
  console.log('\nЕскі модель жойылды:');

  const dropped = await client.query(`
    select column_name from information_schema.columns
    where table_name = 'goals'
      and column_name in ('target_amount','unit','per_week','week_days','weight')
  `);
  eq(dropped.rows.length, 0, 'target_amount / unit / per_week / week_days / weight жоқ');

  const levels = await one(`
    select array_agg(e.enumlabel::text order by e.enumsortorder) as v
    from pg_type t join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'goal_level'
  `);
  eq(levels.v.join(','), 'year,month,week,day', "goal_level — 'stage' жоқ");

  // ── Уақыт қаңқасы ──
  console.log('\nАйлар автоматты ашылады:');

  const user = await one(`insert into auth.users (email) values ('t@forma.kz') returning id`);
  const uid = user.id;

  const goal = await one(
    `insert into goals (user_id, level, title, period_start, period_end)
     values ($1,'year','Тексеріс','2026-08-28','2026-12-31') returning id`,
    [uid],
  );

  const months = await client.query(
    `select title, period_start::text s, period_end::text e
     from goals where parent_id = $1 and level = 'month' order by period_start`,
    [goal.id],
  );
  eq(months.rows.length, 5, '28 тамыз – 31 желтоқсан → 5 ай');
  eq(months.rows[0].s, '2026-08-28', 'бірінші ай мақсаттың басталу күнінен басталады');
  eq(months.rows[0].e, '2026-08-31', 'толық емес алғашқы ай');
  eq(months.rows[4].e, '2026-12-31', 'соңғы ай мерзімде бітеді');
  eq(months.rows[0].title, 'Тамыз 2026', 'ай атауын жүйе қояды');

  // ── Мерзім өзгергенде ──
  console.log('\nМерзім өзгергенде:');

  await client.query(`update goals set period_end = '2027-02-28' where id = $1`, [goal.id]);
  eq(
    (await one(`select count(*)::int n from goals where parent_id=$1 and level='month'`, [goal.id])).n,
    7,
    'мерзім ұзарғанда жаңа айлар қосылады',
  );

  await client.query(`update goals set period_end = '2026-10-31' where id = $1`, [goal.id]);
  eq(
    (await one(`select count(*)::int n from goals where parent_id=$1 and level='month'`, [goal.id])).n,
    3,
    'мерзім қысқарғанда БОС айлар өшеді',
  );

  // Ішінде әрекеті бар ай өшпейді
  await client.query(`update goals set period_end = '2026-12-31' where id = $1`, [goal.id]);
  const dec = await one(
    `select id from goals where parent_id=$1 and level='month'
       and period_start >= '2026-12-01' limit 1`,
    [goal.id],
  );
  await client.query(
    `insert into goals (user_id, parent_id, level, title, period_start, period_end)
     values ($1,$2,'day','Әрекет','2026-12-10','2026-12-10')`,
    [uid, dec.id],
  );
  await client.query(`update goals set period_end = '2026-10-31' where id = $1`, [goal.id]);
  eq(
    (await one(`select count(*)::int n from goals where id=$1`, [dec.id])).n,
    1,
    'ішінде әрекеті бар ай ӨШІРІЛМЕЙДІ',
  );

  // ── Апталар ──
  console.log('\nАпталар автоматты ашылады:');
  await client.query(`update goals set period_end = '2026-12-31' where id = $1`, [goal.id]);
  const sep = await one(
    `select id from goals where parent_id=$1 and level='month'
       and period_start >= '2026-09-01' and period_start < '2026-10-01' limit 1`,
    [goal.id],
  );
  await client.query(`select sync_weeks($1)`, [sep.id]);
  const weeks = await client.query(
    `select period_start::text s, period_end::text e
     from goals where parent_id=$1 and level='week' order by period_start`,
    [sep.id],
  );
  eq(weeks.rows.length, 5, 'қыркүйек → 5 апта');
  eq(weeks.rows[0].s, '2026-09-01', 'бірінші апта айдың басынан');
  eq(weeks.rows[weeks.rows.length - 1].e, '2026-09-30', 'соңғы апта айдың соңында бітеді');

  await client.query(`select sync_weeks($1)`, [sep.id]);
  eq(
    (await one(`select count(*)::int n from goals where parent_id=$1 and level='week'`, [sep.id])).n,
    5,
    'қайта шақырғанда қосарланбайды',
  );

  // ── Пайыз: салмақ жоқ, тек әрекет саны ──
  console.log('\nПайыз — әрекет саны бойынша:');

  const w1 = await one(
    `select id from goals where parent_id=$1 and level='week' order by period_start limit 1`,
    [sep.id],
  );

  const addAction = (parent, date, done = false) =>
    one(
      `insert into goals (user_id, parent_id, level, title, period_start, period_end, status)
       values ($1,$2,'day','Әрекет',$3,$3,$4) returning id`,
      [uid, parent, date, done ? 'done' : 'active'],
    );

  await addAction(w1.id, '2026-09-01', true);
  await addAction(w1.id, '2026-09-02', false);
  await addAction(w1.id, '2026-09-03', false);
  await addAction(w1.id, '2026-09-04', false);

  eq(Number((await one(`select progress($1) v`, [w1.id])).v), 25, 'аптада 4 әрекеттің 1-і → 25%');

  const aug = await one(
    `select id from goals where parent_id=$1 and level='month'
       and period_start < '2026-09-01' limit 1`,
    [goal.id],
  );
  await addAction(aug.id, '2026-08-29', true);

  // Барлығы 6 (4 қыркүйек + 1 тамыз + 1 желтоқсан), орындалғаны 2
  eq(
    Number((await one(`select progress($1) v`, [goal.id])).v),
    33.33,
    'жылда 6 әрекеттің 2-і → 33,33% (салмақ жоқ)',
  );

  const counts = await one(`select * from action_counts($1)`, [goal.id]);
  eq(`${counts.done}/${counts.total}`, '2/6', 'action_counts');

  // ── «Керек еді» — уақыт емес, жоспар ──
  console.log('\n«Керек еді» — жоспар бойынша:');

  // 1 қазанда күні өткен әрекеттер: 29 тамыз + 1–4 қыркүйек = 5
  eq(
    Number((await one(`select planned_progress($1, '2026-10-01'::date) v`, [goal.id])).v),
    83.33,
    '1 қазанда жоспар 83,33% (6-ның 5-і өтіп кеткен)',
  );

  const linear = Math.round(
    ((new Date('2026-10-01') - new Date('2026-08-28')) /
      (new Date('2026-12-31') - new Date('2026-08-28'))) * 100,
  );
  if (linear !== 83) ok(`сызықтық есеп сол күні ${linear}% берер еді — жалған дабыл`);
  else fail('сызықтық есеп кездейсоқ сәйкес келді, тест мағынасыз');

  // ── Әдеттер араласпайды ──
  console.log('\nӘдеттер бөлек:');
  const habit = await one(
    `insert into habits (user_id, title) values ($1,'Ерте тұру') returning id`,
    [uid],
  );
  for (const d of ['2026-09-01', '2026-09-02', '2026-09-03']) {
    await client.query(
      `insert into habit_logs (user_id, habit_id, log_date) values ($1,$2,$3)`,
      [uid, habit.id, d],
    );
  }
  eq(
    Number((await one(`select progress($1) v`, [goal.id])).v),
    33.33,
    'әдет белгілері мақсат пайызын ҚОЗҒАМАДЫ',
  );
  eq(
    Number((await one(`select habit_streak($1, '2026-09-03'::date) v`, [habit.id])).v),
    3,
    'серия 3 күн',
  );

  // ── RLS ──
  console.log('\nRLS:');
  const rls = await client.query(
    `select tablename, rowsecurity from pg_tables where schemaname='public'`,
  );
  const off = rls.rows.filter((r) => !r.rowsecurity).map((r) => r.tablename);
  if (off.length === 0) ok(`барлық ${rls.rows.length} кестеде RLS қосулы`);
  else fail(`RLS қосылмаған: ${off.join(', ')}`);
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
