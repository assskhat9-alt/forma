/**
 * Телефондағы календарь.
 *
 * §7.1: «Тапсырма қосу» дегенде ай торы таңдалған аптаға дейін ЖИЫРЫЛАДЫ
 * және экранның жоғарғы жағында тұрып қалады. Бланка ашық тұрғанда да
 * календарьдан басқа күнді басып, тапсырманың күнін ауыстыруға болады.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter } from '../../theme/tokens';
import { kk, monthsUpper, formatDayMonthWeekday, t as tpl } from '../../i18n/kk';
import { CollapsibleSegments, SectionLabel } from '../ui';
import { MenuIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../icons';
import { MonthGridPhone } from './MonthGridPhone';
import { TaskRow } from './TaskRow';
import { TaskForm, type TaskDraft } from './TaskForm';
import type { DayCell } from '../../lib/calendar';
import type { DayLoad, DayTask } from '../../lib/mock';

type Props = {
  anchor: Date;
  cells: DayCell[];
  selected: Date;
  tasks: DayTask[];
  loadOf: (d: Date) => DayLoad | null;
  adding: boolean;
  draft: TaskDraft;
  periods: readonly string[];
  period: number;
  segOpen: boolean;
  onSelect: (d: Date) => void;
  onToggleTask: (id: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onDraftChange: (d: TaskDraft) => void;
  onSubmit: () => void;
  onPeriod: (i: number) => void;
  onToggleSeg: () => void;
};

export function CalendarPhone(p: Props) {
  const insets = useSafeAreaInsets();
  const done = p.tasks.filter((x) => x.done).length;
  const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* хедер */}
      <View style={styles.header}>
        <MenuIcon size={22} />
        <View style={styles.monthNav}>
          <Pressable onPress={p.onPrevMonth} hitSlop={10} accessibilityRole="button">
            <ChevronLeftIcon size={16} color={C.ink4} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.month}>
            {monthsUpper[p.anchor.getMonth()]} {p.anchor.getFullYear()}
          </Text>
          <Pressable onPress={p.onNextMonth} hitSlop={10} accessibilityRole="button">
            <ChevronRightIcon size={16} color={C.ink4} strokeWidth={2.4} />
          </Pressable>
        </View>
        <FilterIcon size={20} />
      </View>

      {/* период ауыстырғышы */}
      <View style={styles.segWrap}>
        <CollapsibleSegments
          items={p.periods}
          index={p.period}
          onChange={p.onPeriod}
          open={p.segOpen}
          onToggleOpen={p.onToggleSeg}
          maxWidth={260}
        />
      </View>

      {/* КАЛЕНДАРЬ — ешқашан жоғалмайды */}
      <View style={styles.calWrap}>
        <MonthGridPhone
          cells={p.cells}
          selected={p.selected}
          onSelect={p.onSelect}
          collapsed={p.adding}
          onExpand={p.onCloseForm}
          loadOf={p.loadOf}
        />
      </View>

      {p.adding ? (
        <TaskForm
          date={p.selected}
          draft={p.draft}
          onChange={p.onDraftChange}
          onClose={p.onCloseForm}
          onSubmit={p.onSubmit}
          variant="sheet"
        />
      ) : (
        <View style={styles.listWrap}>
          <View style={styles.listHead}>
            <SectionLabel>
              {tpl(kk.calendar.dayHeader, {
                date: formatDayMonthWeekday(p.selected),
                n: p.tasks.length,
              })}
            </SectionLabel>
            <Text style={styles.pct}>{tpl(kk.calendar.donePct, { pct })}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1, flexShrink: 1 }}>
            {p.tasks.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{kk.common.empty}</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {p.tasks.map((task, i) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={p.onToggleTask}
                    last={i === p.tasks.length - 1}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <Pressable onPress={p.onOpenForm} style={styles.addBtn} accessibilityRole="button">
            <PlusIcon size={15} color="#FFFFFF" strokeWidth={2.8} />
            <Text style={styles.addText}>
              {tpl(kk.calendar.addTask, { date: `${p.selected.getDate()}` })}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 6,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  month: { fontFamily: font.display, fontSize: 12, letterSpacing: 1.68, color: C.ink },
  segWrap: { paddingHorizontal: gutter, paddingTop: 6 },
  calWrap: { paddingHorizontal: 14, paddingTop: 11 },

  listWrap: { flexGrow: 1, flexShrink: 1, paddingHorizontal: gutter, paddingTop: 14 },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pct: { fontFamily: font.bold, fontSize: 11, color: C.accent },
  listCard: {
    backgroundColor: C.card,
    borderRadius: R.cardSm,
    paddingHorizontal: 15,
    paddingVertical: 2,
    shadowColor: '#14142D',
    shadowOpacity: 0.045,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontFamily: font.prose, fontSize: 12.5, color: C.ink4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 8,
    paddingVertical: 15,
    borderRadius: R.cardXs,
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  addText: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },
});
