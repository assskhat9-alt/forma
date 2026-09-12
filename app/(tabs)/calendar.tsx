/**
 * Күнтізбе экраны.
 *
 * Күй мұнда тұрады, көрініс үш өлшемге бөлінген:
 *   телефон  → CalendarPhone  (тор жиырылады)
 *   планшет  → CalendarWide   (тор тарылады, күн панелі ығысады)
 *   ПК       → CalendarWide   (үш панель қатар тұрады)
 *
 * Дерек Supabase-тен келеді. Чекбокс optimistic — желі жауабы күтілмейді.
 */
import React, { useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { kk } from '../../i18n/kk';
import { color as C } from '../../theme/tokens';
import { useBreakpoint } from '../../lib/breakpoints';
import { buildMonthGrid, nextMonth, prevMonth } from '../../lib/calendar';
import {
  useDayTasks,
  useLoadOf,
  useToggleTask,
  useCreateAction,
  useRootGoals,
} from '../../lib/goals';
import { KeyboardFrame } from '../../components/layout/KeyboardFrame';
import { CalendarPhone } from '../../components/calendar/CalendarPhone';
import { CalendarWide } from '../../components/calendar/CalendarWide';
import type { TaskDraft } from '../../components/calendar/TaskForm';
import type { DayTask } from '../../lib/goals';

const PERIODS = [kk.period.day, kk.period.week, kk.period.month, kk.period.year] as const;

const TIMES = ['06:00', '08:00', '14:00', '21:00', null] as const;

const EMPTY_DRAFT: TaskDraft = { title: '', timeIndex: 1, goalIndex: 0, repeatIndex: 0 };

export default function CalendarScreen() {
  const bp = useBreakpoint();
  const today = useMemo(() => new Date(), []);

  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(EMPTY_DRAFT);
  const [period, setPeriod] = useState(2); // «АЙ»
  const [segOpen, setSegOpen] = useState(true);

  const { tasks, isLoading } = useDayTasks(selected);
  const loadOf = useLoadOf();
  const toggleTask = useToggleTask();
  const createAction = useCreateAction();
  const rootGoals = useRootGoals();

  const cells = useMemo(() => buildMonthGrid(anchor, today), [anchor, today]);

  const selectDay = (d: Date) => {
    setSelected(d);
    // Бланка ашық тұрса жабылмайды — тек күні ауысады (§7.1)
    if (d.getMonth() !== anchor.getMonth() || d.getFullYear() !== anchor.getFullYear()) {
      setAnchor(d);
    }
  };

  const submit = () => {
    const title = draft.title.trim();
    if (!title) return;

    // 0 = «Жеке шаруа»: goalId берілмейді, әрекет каскадқа кірмейді
    const parentId =
      draft.goalIndex === 0 ? undefined : rootGoals[draft.goalIndex - 1]?.id;

    const repeatMode =
      draft.repeatIndex === 1
        ? ('daily' as const)
        : draft.repeatIndex === 2
        ? ('weekly' as const)
        : ('once' as const);

    createAction.mutate({
      goalId: parentId,
      title,
      date: selected,
      time: TIMES[draft.timeIndex] ?? null,
      repeatMode,
    });

    setDraft(EMPTY_DRAFT);
    setAdding(false);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

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
    onToggleTask: (id: string) => {
      const t = tasks.find((x) => x.id === id);
      if (t) toggleTask.mutate({ id, done: !t.done });
    },
    // Күнтізбедегі әрекетті таңдап, дәл соған таймер қосу
    onFocusTask: (task: DayTask) =>
      router.push(`/focus?taskId=${task.id}` as never),
    onPrevMonth: () => setAnchor((a) => prevMonth(a)),
    onNextMonth: () => setAnchor((a) => nextMonth(a)),
    onOpenForm: () => setAdding(true),
    onCloseForm: () => setAdding(false),
    onDraftChange: setDraft,
    onSubmit: submit,
    onPeriod: setPeriod,
    onToggleSeg: () => setSegOpen((v) => !v),
  };

  // ⚠ Тапсырма қосу пішіні екі нұсқада да экранның төменгі жағында
  // тұр — пернетақтасыз ол көрінбей қалады.
  return (
    <KeyboardFrame>
      {bp === 'phone' ? <CalendarPhone {...shared} /> : <CalendarWide bp={bp} {...shared} />}
    </KeyboardFrame>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
});
