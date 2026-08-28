-- Мақсаттың НӘТИЖЕСІ — әрекеттен бөлек өріс.
--
-- Айырмасы маңызды (CLAUDE.md §1):
--   target_amount + unit  → ӘРЕКЕТ. «80 сабақ», «12 кітап».
--                           Пайыз ТЕК осыдан есептеледі.
--   result_from → result_to + result_unit  → НӘТИЖЕ. «84,2 → 78 кг».
--                           Тек көрсету үшін. Пайызға ҚАТЫСПАЙДЫ.
--
-- Неге бөлек. Forma пайызы «мақсатқа жеттім бе» дегенді емес,
-- «жоспарыма қаншалықты әрекет жасадым» дегенді өлшейді. Салмақ 78 кг-ға
-- түспеуі мүмкін, бірақ 48 жаттығудың 48-і орындалса — пайыз 100%.
-- Нәтижені пайызға қоссақ, адам бақыламайтын нәрсе үшін жазаланар еді.

alter table goals add column if not exists result_from numeric;
alter table goals add column if not exists result_to   numeric;
alter table goals add column if not exists result_unit text;

comment on column goals.result_from is 'Бастапқы мән, мыс. 84.2 — пайызға қатыспайды';
comment on column goals.result_to   is 'Мақсатты мән, мыс. 78 — пайызға қатыспайды';
comment on column goals.result_unit is 'Нәтиженің бірлігі: кг, ₸, см';
