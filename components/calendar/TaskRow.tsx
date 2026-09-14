/**
 * Тапсырма жолы — тізімде де, күн панелінде де қолданылады.
 *
 * Чекбокс басылғанда optimistic update (CLAUDE.md §9): күй бірден
 * ауысады, желі жауабы күтілмейді.
 *
 *  берілсе оң жақта таймер түймесі шығады: әрекетті таңдап,
 * дәл соған фокус қосуға болады. Орындалған әрекетте ол көрінбейді —
 * бітіп қалған іске таймер қосудың мәні жоқ.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { Checkbox } from '../ui';
import { PlayIcon } from '../icons';
import type { DayTask } from '../../lib/goals';

type Props = {
  task: DayTask;
  onToggle: (id: string) => void;
  /** Берілсе — таймер түймесі шығады */
  onFocus?: (task: DayTask) => void;
  /** Күн панелі тар — сондықтан ықшам нұсқа */
  compact?: boolean;
  last?: boolean;
};

export function TaskRow({ task, onToggle, onFocus, compact = false, last = false }: Props) {
  const size = compact ? 19 : 21;

  const isLocked = task.isLocked;

  return (
    <Pressable
      onPress={() => !isLocked && onToggle(task.id)}
      disabled={isLocked}
      style={[
        styles.row,
        { paddingVertical: compact ? 10 : 11 },
        !last && styles.divider,
        isLocked && !task.done && styles.rowLocked,
      ]}
      accessibilityRole="button"
      accessibilityLabel={task.title}
    >
      <Checkbox
        checked={task.done}
        onToggle={isLocked ? undefined : () => onToggle(task.id)}
        disabled={isLocked}
        size={size}
        radius={compact ? 6 : 7}
      />

      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            { fontSize: compact ? 11.5 : 12.5 },
            task.done && styles.titleDone,
            isLocked && !task.done && styles.titleLocked,
          ]}
        >
          {task.title}
        </Text>
        <View style={styles.chipsRow}>
          {task.goal && (
            <View style={[styles.goalChip, { backgroundColor: C.tint }]}>
              <Text style={styles.goalText}>{task.goal.title}</Text>
            </View>
          )}
          {isLocked && !task.done && (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedText}>Мерзімі өткен</Text>
            </View>
          )}
        </View>
      </View>

      {task.time && (
        <Text style={[styles.time, { fontSize: compact ? 9.5 : 10.5 }]}>{task.time}</Text>
      )}

      {onFocus && !task.done && !isLocked && (
        <Pressable
          onPress={() => onFocus(task)}
          style={[styles.focus, compact && styles.focusSm]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${task.title} — таймер`}
        >
          <PlayIcon size={compact ? 9 : 10} color={C.accentDeep} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLocked: { opacity: 0.75 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  body: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  title: { fontFamily: font.body, color: C.ink, lineHeight: 17 },
  titleDone: { color: C.inkFaint, textDecorationLine: 'line-through' },
  titleLocked: { color: C.ink3 },
  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  goalChip: {
    alignSelf: 'flex-start',
    borderRadius: R.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  goalText: { fontFamily: font.bold, fontSize: 9.5, color: C.accentDeep },
  lockedBadge: {
    backgroundColor: C.cardSoft,
    borderRadius: R.pill,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
    borderColor: C.line,
  },
  lockedText: { fontFamily: font.bold, fontSize: 9, color: C.ink3 },
  time: { fontFamily: font.bold, color: C.ink4, flexShrink: 0 },
  focus: {
    width: 28, height: 28, borderRadius: R.pill, flexShrink: 0,
    backgroundColor: C.tintChip,
    alignItems: 'center', justifyContent: 'center',
  },
  focusSm: { width: 24, height: 24 },
});
