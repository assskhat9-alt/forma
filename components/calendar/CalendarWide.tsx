/**
 * Планшет пен ПК-дегі календарь.
 *
 * §7.1: тор ЖИЫРЫЛМАЙДЫ — тарылады, бланка оң жақтан сырғып шығады.
 *
 * Планшет пен ПК-нің айырмасы: планшетте бланка ашылғанда күн панелі
 * ығысып кетеді (орын жетпейді), ал ПК-де үшеуі де қатар тұрады.
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, monthsUpper } from '../../i18n/kk';
import { TopBar } from '../layout/TopBar';
import { CollapsibleSegments } from '../ui';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../icons';
import { MonthGridWide } from './MonthGridWide';
import { DayPanel } from './DayPanel';
import { TaskForm, type TaskDraft } from './TaskForm';
import { calendarLayout, type Breakpoint } from '../../lib/breakpoints';
import type { DayCell } from '../../lib/calendar';
import type { DayLoad, DayTask } from '../../lib/goals';

const EASE = Easing.bezier(0.4, 0, 0.2, 1);
const DUR = 320;

type Props = {
  bp: Breakpoint;
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
  /** Әрекетті таңдап, дәл соған фокус таймерін қосу */
  onFocusTask: (task: DayTask) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onDraftChange: (d: TaskDraft) => void;
  onSubmit: () => void;
  onPeriod: (i: number) => void;
  onToggleSeg: () => void;
};

export function CalendarWide(p: Props) {
  const insets = useSafeAreaInsets();
  const lay = calendarLayout(p.bp, p.adding);

  const dayW = useSharedValue(lay.dayWidth);
  const formW = useSharedValue(lay.formWidth);

  useEffect(() => {
    dayW.value = withTiming(lay.dayWidth, { duration: DUR, easing: EASE });
    formW.value = withTiming(lay.formWidth, { duration: DUR, easing: EASE });
  }, [lay.dayWidth, lay.formWidth, dayW, formW]);

  const dayStyle = useAnimatedStyle(() => ({
    width: dayW.value,
    opacity: lay.dayWidth === 0 ? withTiming(0, { duration: 220 }) : withTiming(1, { duration: 220 }),
  }));

  const formStyle = useAnimatedStyle(() => ({
    width: formW.value,
    opacity: lay.formWidth === 0 ? withTiming(0, { duration: 220 }) : withTiming(1, { duration: 220 }),
  }));

  const monthTitle = `${monthsUpper[p.anchor.getMonth()]!.charAt(0)}${monthsUpper[p.anchor.getMonth()]!.slice(1).toLowerCase()} ${p.anchor.getFullYear()}`;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }]}>
      {/* хедер — панельдің жоғарғы жолағы */}
      <TopBar
        title={monthTitle}
        padH={0}
        actions={
          <Pressable onPress={p.onOpenForm} style={styles.addBtn} accessibilityRole="button">
            <PlusIcon size={13} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.addText}>{kk.calendar.taskLabel}</Text>
          </Pressable>
        }
        right={
          <View style={styles.controls}>
            <View style={styles.arrows}>
              <Pressable onPress={p.onPrevMonth} style={styles.arrow} accessibilityRole="button">
                <ChevronLeftIcon size={14} color={C.darkInk3} strokeWidth={2.4} />
              </Pressable>
              <Pressable onPress={p.onNextMonth} style={styles.arrow} accessibilityRole="button">
                <ChevronRightIcon size={14} color={C.darkInk3} strokeWidth={2.4} />
              </Pressable>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ maxWidth: 340 }}>
              <CollapsibleSegments
                items={p.periods}
                index={p.period}
                onChange={p.onPeriod}
                open={p.segOpen}
                onToggleOpen={p.onToggleSeg}
                maxWidth={300}
              />
            </View>
          </View>
        }
      />

      {/* календарь + сырғымалы панельдер */}
      <View style={[styles.columns, { gap: lay.gap }]}>
        <View style={lay.calendarWidth ? { width: lay.calendarWidth } : { flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
          <MonthGridWide
            cells={p.cells}
            selected={p.selected}
            onSelect={p.onSelect}
            loadOf={p.loadOf}
            maxChips={p.bp === 'desktop' ? 3 : 2}
            longWeekdays={p.bp === 'desktop'}
          />
        </View>

        <Animated.View style={[styles.clip, dayStyle]}>
          <DayPanel
            date={p.selected}
            tasks={p.tasks}
            onToggle={p.onToggleTask}
            onFocus={p.onFocusTask}
            onAdd={p.onOpenForm}
            width={p.bp === 'desktop' ? 300 : 260}
          />
        </Animated.View>

        <Animated.View style={[styles.clip, formStyle]}>
          <TaskForm
            date={p.selected}
            draft={p.draft}
            onChange={p.onDraftChange}
            onClose={p.onCloseForm}
            onSubmit={p.onSubmit}
            variant="panel"
            width={p.bp === 'desktop' ? 380 : 340}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 22 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  arrows: { flexDirection: 'row', gap: 5 },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: R.boxSm,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.lineField,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: R.pill,
    backgroundColor: C.accent,
  },
  addText: { fontFamily: font.bold, fontSize: 12, color: '#FFFFFF' },
  columns: { flexDirection: 'row', flexGrow: 1, minHeight: 0 },
  clip: { flexShrink: 0, overflow: 'hidden' },
});
