/**
 * Басты беттегі таңдалған күннің тапсырмалары мен әдеттер бөлімі.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { Card, DashedCard, SectionLabel, Chip, Checkbox } from '../ui';
import { TaskTable, type TableRow } from './TaskTable';
import { TaskRow } from '../calendar/TaskRow';
import { ChevronRightIcon, StarIcon } from '../icons';
import type { DayTask } from '../../lib/goals';
import type { HabitToday } from '../../lib/habits';

export function TodayTasksSection({
  selected,
  tasks,
  habits,
  isLoading,
  isError,
  wide,
  onToggleTask,
  onToggleHabit,
}: {
  selected: Date;
  tasks: DayTask[];
  habits: HabitToday[];
  isLoading: boolean;
  isError: boolean;
  wide: boolean;
  onToggleTask: (id: string, wasDone: boolean) => void;
  onToggleHabit: (id: string, done: boolean) => void;
}) {
  const todayHabits = habits.filter((h) => h.planned);
  const habitsDone = todayHabits.filter((h) => h.done).length;

  const rows: TableRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    time: t.time,
    done: t.done,
    goal: t.goal ?? { title: kk.calendar.noGoal, color: C.ink4 },
  }));

  return (
    <View style={styles.root}>
      {isLoading ? (
        <Card style={styles.pad}>
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        </Card>
      ) : isError ? (
        <Card style={styles.pad}>
          <Text style={styles.errorText}>{kk.common.loadError}</Text>
        </Card>
      ) : wide ? (
        <TaskTable
          title={kk.home.table}
          rows={rows}
          columns={[kk.home.colAction, kk.home.colGoal, kk.home.colTime, kk.home.colState]}
          emptyText={kk.home.tableEmpty}
          noTimeText={kk.home.noTime}
          doneText={kk.home.stateDone}
          openText={kk.home.stateOpen}
          onToggle={(r) => onToggleTask(r.id, r.done)}
          onFocus={(r) => router.push(`/focus?taskId=${r.id}` as never)}
          right={
            <Pressable
              onPress={() => router.navigate('/calendar' as never)}
              style={styles.round}
              accessibilityRole="link"
            >
              <ChevronRightIcon size={14} color={C.ink2} strokeWidth={2.4} />
            </Pressable>
          }
        />
      ) : tasks.length === 0 ? (
        <Card style={styles.pad}>
          <SectionLabel>Бүгінге тапсырма жоқ</SectionLabel>
          <Text style={styles.emptyText}>Жаңа мақсат пен күн тәртібін қосыңыз.</Text>
        </Card>
      ) : (
        <Card style={styles.pad}>
          <SectionLabel style={{ marginBottom: 6 }}>{kk.today.goalsCard}</SectionLabel>
          {tasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={(id) => onToggleTask(id, task.done)}
              onFocus={(t) => router.push(`/focus?taskId=${t.id}` as never)}
              last={i === tasks.length - 1}
            />
          ))}
        </Card>
      )}

      {/* ── Әдеттер ── */}
      <DashedCard style={styles.padSm}>
        <View style={styles.habHead}>
          <View style={styles.habTitle}>
            <SectionLabel>{kk.today.habits}</SectionLabel>
            <Chip label={kk.today.habitsExcluded} tone="flat" size="sm" />
          </View>
          <Pressable
            onPress={() => router.navigate('/habits' as never)}
            hitSlop={8}
            style={styles.habLink}
            accessibilityRole="link"
          >
            {todayHabits.length > 0 && (
              <Text style={styles.habCount}>
                {habitsDone}/{todayHabits.length}
              </Text>
            )}
            <ChevronRightIcon size={12} color={C.accent} strokeWidth={2.6} />
          </Pressable>
        </View>

        {todayHabits.length === 0 ? (
          <Text style={styles.habEmpty}>{kk.today.habitsNoneToday}</Text>
        ) : (
          <View style={styles.habList}>
            {todayHabits.map((h) => (
              <Pressable
                key={h.id}
                onPress={() => onToggleHabit(h.id, !h.done)}
                style={styles.habItem}
                accessibilityRole="button"
              >
                <Checkbox
                  checked={h.done}
                  onToggle={() => onToggleHabit(h.id, !h.done)}
                  size={20}
                  activeColor={h.color}
                />
                <Text style={[styles.habName, h.done && styles.habNameDone]} numberOfLines={1}>
                  {h.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </DashedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  pad: { padding: 18, borderRadius: 22 },
  padSm: { padding: 16, borderRadius: 20 },
  center: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: font.body, fontSize: 13, color: C.accentDeep },
  emptyText: { fontFamily: font.body, fontSize: 12.5, color: C.ink3, marginTop: 4 },
  round: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  habTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  habLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  habCount: { fontFamily: font.bold, fontSize: 12, color: C.accent },
  habEmpty: { fontFamily: font.body, fontSize: 12, color: C.ink3 },
  habList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  habItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  habName: { fontFamily: font.body, fontSize: 13, color: C.ink },
  habNameDone: { color: C.ink4, textDecorationLine: 'line-through' },
});
