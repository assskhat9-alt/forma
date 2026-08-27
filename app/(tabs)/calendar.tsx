/**
 * Күнтізбе экраны.
 *
 * Күй мұнда тұрады, көрініс үш өлшемге бөлінген:
 *   телефон  → CalendarPhone  (тор жиырылады)
 *   планшет  → CalendarWide   (тор тарылады, күн панелі ығысады)
 *   ПК       → CalendarWide   (үш панель қатар тұрады)
 *
 * ⚠ Дерек `lib/mock.ts`-тен келеді — 1-фазада Supabase сұрауларына ауысады.
 */
import React, { useMemo, useState } from 'react';
import { isSameDay } from 'date-fns';

import { kk } from '../../i18n/kk';
import { useBreakpoint } from '../../lib/breakpoints';
import { buildMonthGrid, nextMonth, prevMonth } from '../../lib/calendar';
import { tasksForDay, loadForDay, MOCK_TODAY } from '../../lib/mock';
import { CalendarPhone } from '../../components/calendar/CalendarPhone';
import { CalendarWide } from '../../components/calendar/CalendarWide';
import type { TaskDraft } from '../../components/calendar/TaskForm';

const PERIODS = [kk.period.day, kk.period.week, kk.period.month, kk.period.year] as const;

const EMPTY_DRAFT: TaskDraft = { title: '', timeIndex: 1, goalIndex: 0, repeatIndex: 0 };

export default function CalendarScreen() {
  const bp = useBreakpoint();

  const [anchor, setAnchor] = useState(MOCK_TODAY);
  const [selected, setSelected] = useState(MOCK_TODAY);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(EMPTY_DRAFT);
  const [period, setPeriod] = useState(2); // «АЙ»
  const [segOpen, setSegOpen] = useState(true);

  // Чекбокстың optimistic күйі — Supabase қосылғанда мутацияға ауысады
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const cells = useMemo(() => buildMonthGrid(anchor, MOCK_TODAY), [anchor]);
  const tasks = useMemo(() => tasksForDay(selected, overrides), [selected, overrides]);
  const loadOf = useMemo(
    () => (d: Date) => loadForDay(d, overrides),
    [overrides],
  );

  const toggleTask = (id: string) => {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    setOverrides((prev) => ({ ...prev, [id]: !current.done }));
  };

  const selectDay = (d: Date) => {
    setSelected(d);
    // Бланка ашық тұрса жабылмайды — тек күні ауысады (§7.1)
    if (!isSameDay(d, anchor)) setAnchor(d);
  };

  const submit = () => {
    // TODO(1-фаза): goals кестесіне level='day' жазбасын қосу
    setDraft(EMPTY_DRAFT);
    setAdding(false);
  };

  const shared = {
    anchor,
    cells,
    selected,
    tasks,
    loadOf,
    adding,
    draft,
    periods: PERIODS,
    period,
    segOpen,
    onSelect: selectDay,
    onToggleTask: toggleTask,
    onPrevMonth: () => setAnchor((a) => prevMonth(a)),
    onNextMonth: () => setAnchor((a) => nextMonth(a)),
    onOpenForm: () => setAdding(true),
    onCloseForm: () => setAdding(false),
    onDraftChange: setDraft,
    onSubmit: submit,
    onPeriod: setPeriod,
    onToggleSeg: () => setSegOpen((v) => !v),
  };

  if (bp === 'phone') return <CalendarPhone {...shared} />;
  return <CalendarWide bp={bp} {...shared} />;
}
