-- RLS — әр қолданушы тек өз деректерін көреді (CLAUDE.md §4).
--
-- Барлық кестеде `user_id = auth.uid()`, тек profiles-та `id = auth.uid()`.
-- Саясаттар бөлек-бөлек жазылған (select/insert/update/delete), себебі
-- `for all` insert кезінде `with check`-ті ұмытып кетуге жол береді.
--
-- Файлды қайта іске қосуға болады: әр саясат алдымен өшіріледі.

alter table profiles       enable row level security;
alter table goals          enable row level security;
alter table reflections    enable row level security;
alter table habits         enable row level security;
alter table habit_logs     enable row level security;
alter table focus_sessions enable row level security;
alter table mottos         enable row level security;
alter table notes          enable row level security;

-- ── profiles ────────────────────────────────────────────────────────

drop policy if exists profiles_select on profiles;
drop policy if exists profiles_insert on profiles;
drop policy if exists profiles_update on profiles;

create policy profiles_select on profiles
  for select using (id = auth.uid());
create policy profiles_insert on profiles
  for insert with check (id = auth.uid());
create policy profiles_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── қалған кестелер: user_id үлгісі ─────────────────────────────────
-- Жеті кестеге бірдей төрт саясат. Қолмен жазса 28 блок болар еді.

do $$
declare
  t text;
begin
  foreach t in array array[
    'goals', 'reflections', 'habits', 'habit_logs',
    'focus_sessions', 'mottos', 'notes'
  ]
  loop
    -- Ескілерін өшіру
    execute format('drop policy if exists %I on %I', t || '_select', t);
    execute format('drop policy if exists %I on %I', t || '_insert', t);
    execute format('drop policy if exists %I on %I', t || '_update', t);
    execute format('drop policy if exists %I on %I', t || '_delete', t);

    -- Әр EXECUTE бір ғана команда орындайды
    execute format(
      'create policy %I on %I for select using (user_id = auth.uid())',
      t || '_select', t);

    execute format(
      'create policy %I on %I for insert with check (user_id = auth.uid())',
      t || '_insert', t);

    execute format(
      'create policy %I on %I for update using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_update', t);

    execute format(
      'create policy %I on %I for delete using (user_id = auth.uid())',
      t || '_delete', t);
  end loop;
end $$;

-- ── Тұтастық: бала мен ата-ана бір қолданушыныкі болуы керек ────────
-- RLS мұны ұстамайды (екеуі де сол қолданушыға көрінеді), сондықтан
-- бөлек тексеріс. Әйтпесе бөтен мақсатқа бала тіркеп жіберуге болар еді.

create or replace function goals_parent_same_owner() returns trigger
language plpgsql as $$
declare
  parent_owner uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select user_id into parent_owner from goals where id = new.parent_id;

  if parent_owner is null then
    raise exception 'parent_id % табылмады', new.parent_id;
  end if;

  if parent_owner <> new.user_id then
    raise exception 'Бала мен ата-ана әртүрлі қолданушыға тиесілі';
  end if;

  return new;
end $$;

drop trigger if exists goals_parent_owner on goals;
create trigger goals_parent_owner
  before insert or update of parent_id, user_id on goals
  for each row execute function goals_parent_same_owner();
