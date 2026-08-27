/**
 * Тапсырма жолы — тізімде де, күн панелінде де қолданылады.
 *
 * Чекбокс басылғанда optimistic update (CLAUDE.md §9): күй бірден
 * ауысады, желі жауабы күтілмейді.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { Checkbox } from '../ui';
import type { DayTask } from '../../lib/goals';

type Props = {
  task: DayTask;
  onToggle: (id: string) => void;
  /** Күн панелі тар — сондықтан ықшам нұсқа */
  compact?: boolean;
  last?: boolean;
};

export function TaskRow({ task, onToggle, compact = false, last = false }: Props) {
  const size = compact ? 19 : 21;

  return (
    <Pressable
      onPress={() => onToggle(task.id)}
      style={[
        styles.row,
        { paddingVertical: compact ? 10 : 11 },
        !last && styles.divider,
      ]}
      accessibilityRole="button"
      accessibilityLabel={task.title}
    >
      <Checkbox
        checked={task.done}
        onToggle={() => onToggle(task.id)}
        size={size}
        radius={compact ? 6 : 7}
      />

      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            { fontSize: compact ? 11.5 : 12.5 },
            task.done && styles.titleDone,
          ]}
        >
          {task.title}
        </Text>
        {task.goal && (
          <View style={[styles.goalChip, { backgroundColor: C.tint }]}>
            <Text style={styles.goalText}>{task.goal.title}</Text>
          </View>
        )}
      </View>

      {task.time && (
        <Text style={[styles.time, { fontSize: compact ? 9.5 : 10.5 }]}>{task.time}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  body: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  title: { fontFamily: font.body, color: C.ink, lineHeight: 17 },
  titleDone: { color: C.inkFaint, textDecorationLine: 'line-through' },
  goalChip: {
    alignSelf: 'flex-start',
    borderRadius: R.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 4,
  },
  goalText: { fontFamily: font.bold, fontSize: 9.5, color: C.accentDeep },
  time: { fontFamily: font.bold, color: C.ink4, flexShrink: 0 },
});
