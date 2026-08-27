-- Прогресс есептері — ЖАЛҒЫЗ АҚИҚАТ КӨЗІ (CLAUDE.md §5).
--
-- Клиентте қайталап есептемеңіз. lib/progress.ts ішіндегі TypeScript
-- нұсқасы тек ЕКІ нәрсе үшін бар: (1) осы алгоритмді тестпен бекіту,
-- (2) «Жаңа мақсат» экранында әлі сақталмаған жоспарды алдын ала көрсету.

-- ════════════════════════════════════════════════════════════════════
-- progress(goal_id) — НАҚТЫ орындалу, төменнен жоғары
-- ════════════════════════════════════════════════════════════════════
--
--   level='day'  →  status='done' ? 100 : 0
--   басқасы      →  балаларының weight бойынша орташа мәні
--
-- ⚠ habit_logs бұл есепке МҮЛДЕ кірмейді. Әдет — мақсат емес.
-- ⚠ status='dropped' балалар есептен мүлде шығарылады: бас тартылған
--    жұмыс пайызды төмен де, жоғары да тартпауы керек.

create or replace function progress(p_goal_id uuid)
returns numeric
language plpgsql
stable
security invoker
as $$
declare
  g          goals%rowtype;
  child      record;
  weight_sum numeric := 0;
  acc        numeric := 0;
begin
  select * into g from goals where id = p_goal_id;
  if not found then
    return 0;
  end if;

  -- Күндік тапсырма — каскадтың жапырағы
  if g.level = 'day' then
    return case when g.status = 'done' then 100 else 0 end;
  end if;

  for child in
    select id, weight
    from goals
    where parent_id = g.id
      and status <> 'dropped'
  loop
    weight_sum := weight_sum + child.weight;
    acc := acc + child.weight * progress(child.id);
  end loop;

  -- Баласы жоқ болса — өзі жапырақ тәрізді
  if weight_sum = 0 then
    return case when g.status = 'done' then 100 else 0 end;
  end if;

  return round(acc / weight_sum, 2);
end $$;


-- ════════════════════════════════════════════════════════════════════
-- planned_progress(goal_id, on_date) — «КЕРЕК ЕДІ» мәні
-- ════════════════════════════════════════════════════════════════════
--
-- ❌ ҚАТЕ:  (бүгін − басталу) / (мерзім − басталу) × 100
-- ✅ ДҰРЫС: Σ(аяқталған кезеңдердің weight-і)
--           + ағымдағы_кезең.weight × (кезеңде өткен күн / кезең ұзақтығы)
--
-- Неге маңызды (CLAUDE.md §5.2). Жүргізуші куәлігі, 26.08 → 26.12.
-- Кезеңдер: курс 40% (26.08–07.11), дайындық 25% (09.11–22.11),
-- тест 10% (24.11), вождение 25% (25.11–22.12).
-- 7 қарашада уақыттың 60%-ы өтті, ал жоспар бойынша 40% болуы керек.
-- Сызықтық есеп «20% арттасың» деп жалған дабыл берер еді.
--
-- Кезеңі ЖОҚ мақсат үшін сызықтық есеп қалады — басқа амал жоқ.
-- Күн санау ҚОСА АЛҒАНДА: 24.11–24.11 кезеңі 1 күн, соңғы күні 100%.

create or replace function planned_progress(p_goal_id uuid, p_on_date date default current_date)
returns numeric
language plpgsql
stable
security invoker
as $$
declare
  g          goals%rowtype;
  child      record;
  weight_sum numeric := 0;
  acc        numeric := 0;
  span_days  numeric;
  gone_days  numeric;
begin
  select * into g from goals where id = p_goal_id;
  if not found then
    return 0;
  end if;

  for child in
    select period_start, period_end, weight
    from goals
    where parent_id = g.id
      and status <> 'dropped'
    order by period_start
  loop
    weight_sum := weight_sum + child.weight;

    if p_on_date > child.period_end then
      -- Кезең толық өтті
      acc := acc + child.weight;
    elsif p_on_date >= child.period_start then
      -- Ағымдағы кезең — үлесі күн санына пропорционал
      span_days := (child.period_end - child.period_start) + 1;
      gone_days := (p_on_date - child.period_start) + 1;
      acc := acc + child.weight * (gone_days / span_days);
    end if;
    -- Әлі басталмаған кезең үлес қоспайды
  end loop;

  if weight_sum > 0 then
    return round(acc / weight_sum * 100, 2);
  end if;

  -- ── Кезеңі жоқ мақсат: өз мерзімі бойынша сызықтық ──
  span_days := (g.period_end - g.period_start) + 1;
  if span_days <= 0 then
    return 0;
  end if;

  gone_days := (p_on_date - g.period_start) + 1;
  if gone_days <= 0 then
    return 0;
  end if;
  if gone_days >= span_days then
    return 100;
  end if;

  return round(gone_days / span_days * 100, 2);
end $$;


-- ════════════════════════════════════════════════════════════════════
-- pace(goal_id, on_date) — оң: алда, теріс: артта
-- ════════════════════════════════════════════════════════════════════

create or replace function pace(p_goal_id uuid, p_on_date date default current_date)
returns numeric
language sql
stable
security invoker
as $$
  select round(progress(p_goal_id) - planned_progress(p_goal_id, p_on_date), 2);
$$;


-- ════════════════════════════════════════════════════════════════════
-- goal_stats(goal_id, on_date) — үшеуін бір сұрауда
-- ════════════════════════════════════════════════════════════════════
-- Клиент әр карточка үшін үш бөлек сұрау жібермеуі керек.

create or replace function goal_stats(p_goal_id uuid, p_on_date date default current_date)
returns table (actual numeric, planned numeric, gap numeric)
language sql
stable
security invoker
as $$
  select
    progress(p_goal_id),
    planned_progress(p_goal_id, p_on_date),
    round(progress(p_goal_id) - planned_progress(p_goal_id, p_on_date), 2);
$$;


-- ════════════════════════════════════════════════════════════════════
-- ӘДЕТТЕР — бөлек есеп, пайызбен ешқашан араласпайды (CLAUDE.md §5.4)
-- ════════════════════════════════════════════════════════════════════

-- Әдет белгілі бір күнге жоспарланған ба?
-- schedule: {"type":"daily"} немесе {"type":"weekly","days":[1,3,5]}
-- days: 1 = дүйсенбі … 7 = жексенбі (ISO)
create or replace function habit_planned_on(p_schedule jsonb, p_date date)
returns boolean
language sql
immutable
as $$
  select case p_schedule->>'type'
    when 'daily'  then true
    when 'weekly' then (p_schedule->'days') @> to_jsonb(extract(isodow from p_date)::int)
    else true
  end;
$$;

-- Бүгіннен артқа қарай үзіліссіз орындалған күн саны.
-- ⚠ §5.4: өткізіп алған әдет күнін келесі күнге КӨШІРУГЕ БОЛМАЙДЫ.
-- Жоспарланбаған күндер серияны үзбейді, бірақ ұзартпайды да.
create or replace function habit_streak(p_habit_id uuid, p_today date default current_date)
returns int
language plpgsql
stable
security invoker
as $$
declare
  h      habits%rowtype;
  d      date := p_today;
  n      int := 0;
  logged boolean;
begin
  select * into h from habits where id = p_habit_id;
  if not found then
    return 0;
  end if;

  -- 400 күннен әрі қарамаймыз — шексіз цикл болмасын
  for i in 1..400 loop
    if habit_planned_on(h.schedule, d) then
      select exists(
        select 1 from habit_logs
        where habit_id = h.id and log_date = d
      ) into logged;

      if logged then
        n := n + 1;
      elsif d < p_today then
        -- Бүгін әлі орындалмаған болуы мүмкін — оны үзіліс деп санамаймыз
        exit;
      end if;
    end if;

    d := d - 1;
  end loop;

  return n;
end $$;

-- Соңғы 30 күндегі тұрақтылық: орындалған / жоспарланған × 100
create or replace function habit_consistency(p_habit_id uuid, p_today date default current_date)
returns numeric
language plpgsql
stable
security invoker
as $$
declare
  h       habits%rowtype;
  d       date;
  planned int := 0;
  done    int := 0;
begin
  select * into h from habits where id = p_habit_id;
  if not found then
    return 0;
  end if;

  for i in 0..29 loop
    d := p_today - i;
    if habit_planned_on(h.schedule, d) then
      planned := planned + 1;
      if exists(select 1 from habit_logs where habit_id = h.id and log_date = d) then
        done := done + 1;
      end if;
    end if;
  end loop;

  if planned = 0 then
    return 0;
  end if;

  return round(done::numeric / planned * 100, 2);
end $$;
