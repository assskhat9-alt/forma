/**
 * АПТА ҚОРЫТЫНДЫСЫ (Week Summary Screen).
 *
 * Аптаның орындалу пайызы, серпіні, 7 күндік жүктемесі мен тапсырмалары
 * және апталық сабақтар/рефлексия.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter, centered } from '../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useAutosave } from '../lib/autosave';
import { useBreakpoint } from '../lib/breakpoints';
import { weekNumber } from '../lib/calendar';
import { startOfWeek, addDays } from '../lib/report';
import {
  useWeekSummary, useMoveAction, useDropAction, useRootIdOf,
  useWeekLesson, useWeekLessons, useSaveWeekLesson, useDeleteWeekLesson,
} from '../lib/week';
import { Card, SectionLabel } from '../components/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { KeyboardFrame } from '../components/layout/KeyboardFrame';
import { LessonNote } from '../components/week/LessonNote';
import { WeekDayStrip } from '../components/week/WeekDayStrip';
import { WeekTasksView } from '../components/week/WeekTasksView';
import { WeekHeroStats } from '../components/week/WeekHeroStats';

function stampFor(from: Date, to: Date, now: Date) {
  return now >= from && now <= addDays(to, 1) ? now : to;
}

export default function WeekScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const now = new Date();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rep = useWeekSummary(weekStart, now);
  const { data: lesson, isPending: lessonPending } = useWeekLesson(rep.from, rep.to);
  const { data: lessons } = useWeekLessons();
  const rootIdOf = useRootIdOf();
  const move = useMoveAction();
  const drop = useDropAction();
  const saveLesson = useSaveWeekLesson();
  const removeLesson = useDeleteWeekLesson();

  const lessonId = useRef<string | null>(null);

  const auto = useAutosave<string>({
    onSave: async (raw) => {
      const body = raw.trim();
      const id = lessonId.current;
      if (!body) {
        if (id) {
          await removeLesson.mutateAsync(id);
          lessonId.current = null;
        }
        return;
      }
      const row = await saveLesson.mutateAsync({
        id, body, at: stampFor(rep.from, rep.to, now),
      });
      lessonId.current = row.id;
    },
    onError: (e) => setError(errorText(e)),
  });

  const weekKey = rep.from.getTime();
  const filledFor = useRef<number | null>(null);

  useEffect(() => {
    if (lessonPending) return;
    if (filledFor.current === weekKey) return;
    filledFor.current = weekKey;
    setNote(lesson?.body ?? '');
    lessonId.current = lesson?.id ?? null;
    auto.reset();
  }, [weekKey, lessonPending, lesson?.id, lesson?.body, auto]);

  const rangeLabel = tpl(kk.week.range, {
    n: weekNumber(rep.from),
    from: formatDayMonth(rep.from),
    to: formatDayMonth(rep.to),
  });

  const current = startOfWeek(now).getTime() === rep.from.getTime();

  const moveToNextWeek = (id: string, date: string) => {
    setError(null);
    const next = addDays(new Date(date + 'T00:00:00'), 7);
    move.mutate(
      { id, date: next, rootId: rootIdOf(id) },
      { onError: (e) => setError(errorText(e)) },
    );
  };

  const goWeek = (next: Date) => {
    auto.flush();
    setSelectedDayIso(null);
    setWeekStart(next);
  };

  return (
    <KeyboardFrame>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          ...centered,
          paddingTop: insets.top + (wide ? 18 : 12),
          paddingBottom: insets.bottom + 36,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <Pressable onPress={() => goBack('/')} hitSlop={10} accessibilityRole="button">
            <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>{kk.week.title}</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.body}>
          {/* Апта навигациясы */}
          <View style={styles.nav}>
            <Pressable
              onPress={() => goWeek(addDays(weekStart, -7))}
              style={styles.arrow}
              accessibilityRole="button"
              accessibilityLabel={kk.week.prev}
            >
              <ChevronLeftIcon size={14} color={C.ink3} strokeWidth={2.4} />
            </Pressable>

            <View style={styles.navTitleWrap}>
              <Text style={styles.navTitle}>{rangeLabel}</Text>
              {!current && (
                <Pressable
                  onPress={() => goWeek(startOfWeek(now))}
                  style={styles.currentPill}
                  accessibilityRole="button"
                >
                  <Text style={styles.currentPillText}>Осы апта</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => rep.canGoNext && goWeek(addDays(weekStart, 7))}
              disabled={!rep.canGoNext}
              style={[styles.arrow, !rep.canGoNext && { opacity: 0.3 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.week.next}
            >
              <ChevronRightIcon size={14} color={C.ink3} strokeWidth={2.4} />
            </Pressable>
          </View>

          {rep.isLoading ? (
            <Card style={styles.pad}>
              <View style={styles.center}>
                <ActivityIndicator color={C.accent} />
              </View>
            </Card>
          ) : (
            <>
              {/* Аптаның негізгі көрсеткіштері */}
              <WeekHeroStats rep={rep} current={current} />

              {/* 7 күндік жүктеме жолағы */}
              <WeekDayStrip
                days={rep.days}
                selectedIso={selectedDayIso}
                onSelectDay={setSelectedDayIso}
              />

              {/* Тапсырмалардың интерактивті тізімі */}
              <WeekTasksView
                actions={rep.allActions}
                selectedDayIso={selectedDayIso}
                onMoveAction={moveToNextWeek}
                onDropAction={(id) => drop.mutate(id)}
                movePending={move.isPending}
                dropPending={drop.isPending}
              />

              {/* Апта сабағы мен рефлексиясы */}
              <SectionLabel style={{ paddingLeft: 4, marginTop: 4 }}>{kk.week.lesson}</SectionLabel>
              <LessonNote
                weekLabel={rangeLabel}
                value={note}
                onChange={(v) => { setNote(v); auto.push(v); }}
                onBlur={auto.flush}
                state={auto.state}
                currentId={lessonId.current}
                lessons={lessons ?? []}
                onOpen={(d) => goWeek(startOfWeek(d))}
              />

              {error && <Text style={styles.error}>{error}</Text>}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: { fontFamily: font.display, fontSize: 12, letterSpacing: 1.8, color: C.ink },
  body: { paddingHorizontal: gutter, gap: 12 },
  pad: { padding: 17 },
  center: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, textAlign: 'center' },

  nav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 32, height: 32, borderRadius: R.boxSm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.lineField,
  },
  navTitleWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navTitle: { fontFamily: font.bold, fontSize: 12.5, color: C.ink },
  currentPill: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.pill,
    backgroundColor: C.tint, borderWidth: 1, borderColor: C.tintLine,
  },
  currentPillText: { fontFamily: font.bold, fontSize: 10, color: C.accentDeep },
});
