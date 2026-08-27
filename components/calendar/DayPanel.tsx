/**
 * Таңдалған күннің панелі — планшет пен ПК-де календарьдың оң жағында.
 * Телефонда бұл панель жоқ, оның орнына тор астындағы тізім тұрады.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { SectionLabel, ProgressBar } from '../ui';
import { PlusIcon } from '../icons';
import { TaskRow } from './TaskRow';
import { formatDayMonthWeekday } from '../../i18n/kk';
import type { DayTask } from '../../lib/mock';

type Props = {
  date: Date;
  tasks: DayTask[];
  onToggle: (id: string) => void;
  onAdd: () => void;
  width: number;
};

export function DayPanel({ date, tasks, onToggle, onAdd, width }: Props) {
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <View style={[styles.card, { width }]}>
      <SectionLabel>{formatDayMonthWeekday(date)}</SectionLabel>

      <View style={styles.headRow}>
        <Text style={styles.pct}>{pct}%</Text>
        <Text style={styles.count}>
          {done}/{tasks.length} орындалды
        </Text>
      </View>

      <ProgressBar pct={pct} height={6} style={{ marginTop: 11 }} />

      {tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Бұл күнге тапсырма жоқ</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {tasks.map((t, i) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={onToggle}
              compact
              last={i === tasks.length - 1}
            />
          ))}
        </ScrollView>
      )}

      <Pressable onPress={onAdd} style={styles.addBtn} accessibilityRole="button">
        <PlusIcon size={13} color={C.accentDeep} strokeWidth={2.8} />
        <Text style={styles.addText}>Осы күнге қосу</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: '100%',
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#14142D',
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  headRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 7 },
  pct: { fontFamily: font.display, fontSize: 28, letterSpacing: -1.12, color: C.ink },
  count: { fontFamily: font.title, fontSize: 11, color: C.inkMuted },
  list: { flexGrow: 1, flexShrink: 1, marginTop: 14 },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: font.prose, fontSize: 12, color: C.ink4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: R.input,
    backgroundColor: C.tintRow,
    marginTop: 12,
  },
  addText: { fontFamily: font.bold, fontSize: 12, color: C.accentDeep },
});
