-- ӘРЕКЕТТЕР ТІКЕЛЕЙ АЙҒА ТІРКЕЛЕДІ.
--
-- Апта енді ҚҰРЫЛЫМ емес. Ол — телефондағы «экран уақыты» статистикасы
-- сияқты фон: әрекеттердің күндерінен есептеліп шығады, бірақ ештеңені
-- ұстап тұрмайды.
--
--   Бұрын:  жыл → ай → АПТА → әрекет
--   Енді:   жыл → ай → әрекет
--
-- Апта жазбалары жойылады, олардың астындағы әрекеттер айға көшіріледі.
-- `goal_level` ішіндегі 'week' мәні қалады: enum-нан мән алу — кестені
-- толық қайта жазу, ал одан ешқандай пайда жоқ. Ол жай ғана
-- қолданылмайды.

-- ── 1. Әрекеттерді аптадан айға көшіру ───────────────────────────────

update goals a
set parent_id = w.parent_id
from goals w
where a.parent_id = w.id
  and w.level = 'week'
  and a.level = 'day';

-- ── 2. Апта жазбалары жойылады ───────────────────────────────────────

delete from goals where level = 'week';

-- ── 3. sync_weeks енді керек емес ────────────────────────────────────

drop function if exists sync_weeks(uuid);

-- ── 4. Апта — тек СТАТИСТИКА ─────────────────────────────────────────
--
-- Айдың барлық аптасын қайтарады, әрекеті жоқ аптаны да. Сан
-- әрекеттердің КҮНІНЕН есептеледі, сақталған апта жазбасынан емес.
--
-- Апта дүйсенбіден басталады (CLAUDE.md §9). Шеттегі толымсыз апталар
-- айдың шегімен қиылады.

create or replace function month_week_stats(p_month_id uuid)
returns table (week_start date, week_end date, total int, done int)
language sql
stable
security invoker
as $$
  with m as (
    select period_start as ps, period_end as pe
    from goals where id = p_month_id
  ),
  weeks as (
    select
      greatest(w::date, m.ps) as ws,
      least(w::date + 6, m.pe) as we
    from m,
    generate_series(
      date_trunc('week', m.ps::timestamp),
      date_trunc('week', m.pe::timestamp),
      interval '7 days'
    ) w
  )
  select
    weeks.ws,
    weeks.we,
    count(g.id)::int,
    count(g.id) filter (where g.status = 'done')::int
  from weeks
  left join goals g
    on g.parent_id = p_month_id
   and g.level = 'day'
   and g.status <> 'dropped'
   and g.period_start between weeks.ws and weeks.we
  group by weeks.ws, weeks.we
  order by weeks.ws;
$$;

-- ── 5. Күн бойынша тиісті айды табу ──────────────────────────────────
--
-- Пайдаланушы күнтізбеден басқа айдың күнін таңдаса, әрекет сол айға
-- ӨЗІ көшеді. «Тек осы айға қоя аласыз» деген шектеу жоқ.
--
-- Күн мақсаттың мерзімінен тыс болса `null` қайтарады — интерфейс
-- сонда ғана ескертеді.

create or replace function month_for_date(p_goal_id uuid, p_date date)
returns uuid
language sql
stable
security invoker
as $$
  select m.id
  from goals m
  where m.parent_id = p_goal_id
    and m.level = 'month'
    and m.status <> 'dropped'
    and p_date between m.period_start and m.period_end
  limit 1;
$$;
