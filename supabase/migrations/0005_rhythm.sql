-- Ырғақ — ПАЙДАЛАНУШЫ қоятын өрістер.
--
-- ⚠ Ұстаным (CLAUDE.md §5.2a): ЖҮЙЕ ЖОСПАРДЫ ӨЗІ ҚҰРМАЙДЫ.
-- Бұл екі баған «ұсынылған қарқын» емес — адам өзі шешкен ырғақ.
-- Жүйе тек санайды және қайшылықты көрсетеді.
--
--   per_week   → аптасына неше рет. Мысалы 2.
--   week_days  → қай күндері. ISO: 1=дүйсенбі … 7=жексенбі.
--                Мысалы {1,3,5} — дүйсенбі, сәрсенбі, жұма.
--
-- Екеуі де progress() есебіне КІРМЕЙДІ. Пайыз тек target_amount пен
-- аяқталған әрекеттерден есептеледі. Ырғақ — жоспарды құру құралы,
-- орындалуды өлшеу құралы емес.

alter table goals add column if not exists per_week  int;
alter table goals add column if not exists week_days smallint[];

alter table goals drop constraint if exists goals_per_week_positive;
alter table goals add  constraint goals_per_week_positive
  check (per_week is null or per_week > 0);

-- Күн нөмірлері ISO ауқымында болсын
alter table goals drop constraint if exists goals_week_days_range;
-- ⚠ CHECK ішінде ішкі сұрау (subquery) ҚОЛДАНУҒА БОЛМАЙДЫ — Postgres
-- «cannot use subquery in check constraint» деп құлайды. Сондықтан
-- «бәрі рұқсат етілген жиынға кіре ме» дегенді <@ операторымен тексереміз.
alter table goals add  constraint goals_week_days_range
  check (
    week_days is null
    or (
      array_length(week_days, 1) between 1 and 7
      and week_days <@ array[1,2,3,4,5,6,7]::smallint[]
    )
  );

comment on column goals.per_week  is 'Аптасына неше рет — пайдаланушы қояды, пайызға кірмейді';
comment on column goals.week_days is 'ISO апта күндері 1..7 — пайдаланушы қояды, пайызға кірмейді';
