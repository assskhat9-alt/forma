-- Forma — негізгі схема (CLAUDE.md §4).
--
-- Ең маңызды екі шешім:
--   1. Бүкіл каскад (жыл → кезең → ай → апта → күн) БІР кестеде,
--      parent_id арқылы. Деңгейлер үшін бөлек кесте жасалмайды.
--   2. Әдеттер (habits, habit_logs) goals-пен МҮЛДЕ байланыспайды.
--      Бұл әдейі: әдет — жететін нәтиже емес, күнделікті рефлекс.

-- Файлды қайта іске қосуға болады: бәрі `if not exists` арқылы қорғалған.

create extension if not exists "pgcrypto";

do $$ begin
  create type goal_level as enum ('year','stage','month','week','day');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_status as enum ('active','done','dropped','paused');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  timezone     text default 'Asia/Qyzylorda',
  -- ⚠ Аудитте табылған олқылық: Мотивация экранында «Күн сайын кезекпен
  -- ауыссын» ажыратқышы бар, ал схемада оны сақтайтын жер жоқ еді.
  -- Параметр жеке сөзге емес, аккаунтқа тиесілі — сондықтан осында.
  motto_rotate boolean default false,
  created_at   timestamptz default now()
);

create table if not exists goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  parent_id     uuid references goals(id) on delete cascade,
  level         goal_level  not null,
  title         text not null,
  note          text,
  period_start  date not null,
  period_end    date not null,          -- level='year' болса бұл — МЕРЗІМ (deadline)
  weight        numeric not null default 1 check (weight > 0),
  target_amount numeric,                -- 80 сабақ, 12 кітап
  unit          text,                   -- 'сабақ' | 'кітап' | 'кг' | '₸'
  locked        boolean default false,  -- бекітілген күн (емтихан) — жылжымайды
  status        goal_status default 'active',
  scheduled_at  timestamptz,            -- level='day' үшін уақыты
  completed_at  timestamptz,
  sort_order    int default 0,
  created_at    timestamptz default now(),

  constraint goals_period_order check (period_end >= period_start)
);

create index if not exists idx_goals_user_level_start on goals(user_id, level, period_start);
create index if not exists idx_goals_parent on goals(parent_id);
-- planned_progress() балаларды period_start бойынша реттеп жүреді
create index if not exists idx_goals_parent_start on goals(parent_id, period_start);

create table if not exists reflections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  goal_id       uuid references goals(id) on delete cascade,
  body          text,
  rating        smallint check (rating between 1 and 4),  -- Қиын|Орташа|Жақсы|Керемет
  minutes_spent int check (minutes_spent is null or minutes_spent >= 0),
  created_at    timestamptz default now()
);

create index if not exists idx_reflections_user_created on reflections(user_id, created_at desc);
create index if not exists idx_reflections_goal on reflections(goal_id);

-- ── ӘДЕТТЕР ─────────────────────────────────────────────────────────
-- goals-пен байланыспайды. Пайызға ешқашан қосылмайды.

create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  title       text not null,
  schedule    jsonb not null default '{"type":"daily"}',  -- {type:'weekly',days:[1,3,5]}
  color       text default '#7A6CF0',
  archived_at timestamptz,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

create table if not exists habit_logs (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null,
  minutes  int,
  unique (habit_id, log_date)
);

create index if not exists idx_habit_logs_user_date on habit_logs(user_id, log_date);

-- ── ФОКУС ───────────────────────────────────────────────────────────

create table if not exists focus_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  goal_id    uuid references goals(id) on delete set null,
  habit_id   uuid references habits(id) on delete set null,
  started_at timestamptz,
  minutes    int not null check (minutes > 0),
  source     text not null check (source in ('timer','manual')),
  created_at timestamptz default now(),

  -- ⚠ CLAUDE.md §4-те бұл `= 1` еді. Босаңсытылды: Уақыт есебі экранында
  -- «Басқа» деген баған бар — мақсатқа да, әдетке де байланбаған уақыт.
  -- `= 1` болса ол баған ешқашан толмайтын еді.
  constraint focus_target check (num_nonnulls(goal_id, habit_id) <= 1)
);

create index if not exists idx_focus_user_started on focus_sessions(user_id, started_at desc);
create index if not exists idx_focus_goal on focus_sessions(goal_id);

-- ── МОТИВАЦИЯ ЖӘНЕ ЖАЗБАЛАР ─────────────────────────────────────────

create table if not exists mottos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  text       text not null,
  is_active  boolean default false,
  created_at timestamptz default now()
);

create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  title      text,
  body       text,
  -- ⚠ Аудитте табылған олқылық: тулбарда 4 құрал (мәтін/қалам/маркер/
  -- өшіргіш) бар, ал ескі пішінде {color,width,points} ғана еді —
  -- маркердің мөлдірлігі мен құрал типі сақталмайтын.
  -- Жаңа пішін: [{tool,color,width,opacity,points:[[x,y],…]}]
  strokes    jsonb,
  goal_id    uuid references goals(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notes_user_updated on notes(user_id, updated_at desc);

-- updated_at өзі жаңарсын
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists notes_touch on notes;
create trigger notes_touch before update on notes
  for each row execute function touch_updated_at();

-- Жаңа қолданушыға profiles жолын автоматты құру
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
