-- УАҚЫТ ҚАҢҚАСЫ — түбегейлі қайта құру.
--
-- Негізгі ұстаным:
--   Автоматты болатыны — УАҚЫТ ҚАҢҚАСЫ (айлар, апталар).
--   Қолмен болатыны   — оның ІШІНДЕГІ МАЗМҰН (әрекеттер).
--
-- Жүйе жүктемені ешқашан өзі шешпейді. Ол тек уақыт контейнерлерін
-- ашады және санайды.
--
-- ⚠ Бұл миграция бұрынғы модельді жояды: 'stage' деңгейі, көлем, бірлік,
-- ырғақ, апта күндері және САЛМАҚ — бәрі алынады. Пайыз енді салмақпен
-- емес, әрекет САНЫМЕН есептеледі.

-- ── 1. 'stage' деңгейі жойылады ──────────────────────────────────────
-- Postgres enum мәнін тікелей өшіре алмайды — типті қайта құрамыз.

-- ⚠ Файлды екінші рет іске қосқанда 'stage' енді жоқ, сондықтан
-- `level = 'stage'` деген литерал типке айналмай құлайды.
-- Бәрін бір қорғаудың ішіне саламыз, салыстыруды ::text арқылы жасаймыз.

do $$ begin
  if exists (
    select 1 from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'goal_level' and e.enumlabel = 'stage'
  ) then
    delete from goals where level::text = 'stage';

    alter type goal_level rename to goal_level_old;
    create type goal_level as enum ('year','month','week','day');
    alter table goals alter column level type goal_level
      using level::text::goal_level;
    drop type goal_level_old;
  end if;
end $$;

-- ── 2. Ескі модельдің бағандары ──────────────────────────────────────
-- Көлем дегеніміз енді бөлек өріс емес — қосылған әрекеттердің САНЫ.
-- Салмақ керек емес: көп әрекет тұрған ай үлесті өзі көп алады.

alter table goals drop column if exists target_amount;
alter table goals drop column if exists unit;
alter table goals drop column if exists per_week;
alter table goals drop column if exists week_days;
alter table goals drop column if exists weight;

-- ── 3. Ай атауы ──────────────────────────────────────────────────────
-- Атауды жүйе қояды, пайдаланушы емес.

create or replace function month_title_kk(d date) returns text
language sql immutable as $$
  select (array[
    'Қаңтар','Ақпан','Наурыз','Сәуір','Мамыр','Маусым',
    'Шілде','Тамыз','Қыркүйек','Қазан','Қараша','Желтоқсан'
  ])[extract(month from d)::int] || ' ' || extract(year from d)::text;
$$;

-- ── 4. АЙЛАР автоматты ашылады ───────────────────────────────────────
--
-- Мақсаттың мерзіміне түсетін әр айға бір жазба. Толық емес айлар да
-- қосылады: мерзім айдың ортасында басталса, сол айдың қалған бөлігі
-- бір жазба болады.
--
-- Мерзім өзгергенде: жаңа айлар қосылады, аралықтан шыққан БОС айлар
-- өшіріледі, ал ішінде әрекеті бар ай ӨШІРІЛМЕЙДІ — оның саны
-- қайтарылады, интерфейс ескерту көрсетеді.

create or replace function sync_months(p_goal_id uuid)
returns int
language plpgsql
security invoker
as $$
declare
  g       goals%rowtype;
  cur     date;
  m_start date;
  m_end   date;
  orphans int := 0;
begin
  select * into g from goals where id = p_goal_id;
  if not found or g.level <> 'year' then
    return 0;
  end if;

  -- Аралықтан шыққан БОС айлар өшеді
  delete from goals c
  where c.parent_id = g.id
    and c.level = 'month'
    and (c.period_end < g.period_start or c.period_start > g.period_end)
    and not exists (select 1 from goals d where d.parent_id = c.id);

  -- Ішінде әрекеті бары қалады — тек саналады
  select count(*) into orphans
  from goals c
  where c.parent_id = g.id
    and c.level = 'month'
    and (c.period_end < g.period_start or c.period_start > g.period_end);

  -- Жетіспейтін айларды қосу
  cur := date_trunc('month', g.period_start)::date;
  while cur <= g.period_end loop
    m_start := greatest(cur, g.period_start);
    m_end   := least((cur + interval '1 month' - interval '1 day')::date, g.period_end);

    if not exists (
      select 1 from goals c
      where c.parent_id = g.id
        and c.level = 'month'
        and date_trunc('month', c.period_start)::date = cur
    ) then
      insert into goals (user_id, parent_id, level, title, period_start, period_end, sort_order)
      values (
        g.user_id, g.id, 'month', month_title_kk(m_start), m_start, m_end,
        extract(year from cur)::int * 12 + extract(month from cur)::int
      );
    else
      -- Бар айдың шеттері мерзімге қарай қысқаруы/ұзаруы мүмкін
      update goals c
      set period_start = m_start, period_end = m_end
      where c.parent_id = g.id
        and c.level = 'month'
        and date_trunc('month', c.period_start)::date = cur
        and (c.period_start <> m_start or c.period_end <> m_end);
    end if;

    cur := (cur + interval '1 month')::date;
  end loop;

  return orphans;
end $$;

-- ── 5. АПТАЛАР автоматты ашылады ─────────────────────────────────────
--
-- Айға кіргенде сол айдың апталары ашылады — мақсат терезесіне түсетін
-- бөлігі ғана. Апта ДҮЙСЕНБІДЕН басталады.

create or replace function sync_weeks(p_month_id uuid)
returns int
language plpgsql
security invoker
as $$
declare
  m     goals%rowtype;
  root  goals%rowtype;
  lo    date;
  hi    date;
  cur   date;
  w_beg date;
  w_end date;
  added int := 0;
begin
  select * into m from goals where id = p_month_id;
  if not found or m.level <> 'month' then
    return 0;
  end if;

  select * into root from goals where id = m.parent_id;

  -- Ай мен мақсат терезесінің қиылысы
  lo := greatest(m.period_start, coalesce(root.period_start, m.period_start));
  hi := least(m.period_end, coalesce(root.period_end, m.period_end));
  if lo > hi then
    return 0;
  end if;

  -- Бос апталарды тазалау (мерзім тарылса)
  delete from goals w
  where w.parent_id = m.id
    and w.level = 'week'
    and (w.period_end < lo or w.period_start > hi)
    and not exists (select 1 from goals d where d.parent_id = w.id);

  cur := date_trunc('week', lo::timestamp)::date;  -- ISO: дүйсенбі
  while cur <= hi loop
    w_beg := greatest(cur, lo);
    w_end := least(cur + 6, hi);

    if not exists (
      select 1 from goals w
      where w.parent_id = m.id
        and w.level = 'week'
        and date_trunc('week', w.period_start::timestamp)::date = cur
    ) then
      insert into goals (user_id, parent_id, level, title, period_start, period_end, sort_order)
      values (
        m.user_id, m.id, 'week',
        extract(week from w_beg)::text || '-апта', w_beg, w_end,
        (cur - date '2000-01-03') / 7
      );
      added := added + 1;
    end if;

    cur := cur + 7;
  end loop;

  return added;
end $$;

-- ── 6. Қаңқа мақсатпен бірге туады ───────────────────────────────────
-- Жылдық мақсат сақталған сәтте айлар өзі ашылады. Мерзім өзгерсе де.

create or replace function goals_sync_months_tg() returns trigger
language plpgsql as $$
begin
  perform sync_months(new.id);
  return null;
end $$;

drop trigger if exists goals_sync_months on goals;
create trigger goals_sync_months
  after insert or update of period_start, period_end on goals
  for each row
  when (new.level = 'year')
  execute function goals_sync_months_tg();

-- ── 7. ПАЙЫЗ — салмақ жоқ, тек әрекет саны ───────────────────────────
--
--   орындалған әрекеттер ÷ барлық әрекеттер × 100
--
-- Ай да, апта да, жыл да осы БІР формуламен есептеледі — өз астындағы
-- әрекеттерді жинап. Көп әрекет тұрған ай үлесті өзі көп алады,
-- сондықтан weight керек емес.
--
-- ⚠ habit_logs бұл есепке МҮЛДЕ кірмейді.

create or replace function progress(p_goal_id uuid)
returns numeric
language sql
stable
security invoker
as $$
  with recursive tree as (
    select id, level, status from goals where id = p_goal_id
    union all
    select g.id, g.level, g.status
    from goals g
    join tree t on g.parent_id = t.id
    where g.status <> 'dropped'
  )
  select case
    when count(*) filter (where level = 'day') = 0 then 0
    else round(
      count(*) filter (where level = 'day' and status = 'done')::numeric
      / count(*) filter (where level = 'day') * 100, 2)
  end
  from tree;
$$;

-- ── 8. «КЕРЕК ЕДІ» — уақыт емес, жоспардың өзі ───────────────────────
--
--   ❌ ҚАТЕ:  (бүгін − басталу) ÷ (мерзім − басталу) × 100
--   ✅ ДҰРЫС: күні өтіп кеткен әрекеттер ÷ барлық әрекеттер × 100
--
-- Эталон — уақыт емес, адамның өз жоспары. Ол әрекеттерді біркелкі
-- таратпауы мүмкін: алғашқы айларда аз, соңғы айда көп. Сызықтық есеп
-- мұндайда жалған дабыл берер еді.

create or replace function planned_progress(p_goal_id uuid, p_on_date date default current_date)
returns numeric
language sql
stable
security invoker
as $$
  with recursive tree as (
    select id, level, period_start, status from goals where id = p_goal_id
    union all
    select g.id, g.level, g.period_start, g.status
    from goals g
    join tree t on g.parent_id = t.id
    where g.status <> 'dropped'
  )
  select case
    when count(*) filter (where level = 'day') = 0 then 0
    else round(
      count(*) filter (where level = 'day' and period_start < p_on_date)::numeric
      / count(*) filter (where level = 'day') * 100, 2)
  end
  from tree;
$$;

-- pace пен goal_stats өзгермейді — жаңа функцияларды шақырады

-- ── 9. Әрекет саны — интерфейске жиі керек ───────────────────────────

create or replace function action_counts(p_goal_id uuid)
returns table (total int, done int)
language sql
stable
security invoker
as $$
  with recursive tree as (
    select id, level, status from goals where id = p_goal_id
    union all
    select g.id, g.level, g.status
    from goals g
    join tree t on g.parent_id = t.id
    where g.status <> 'dropped'
  )
  select
    count(*) filter (where level = 'day')::int,
    count(*) filter (where level = 'day' and status = 'done')::int
  from tree;
$$;
