/**
 * АПТА ҚОРЫТЫНДЫСЫ (design/AptaQoryt.dc.html).
 *
 * Аптаның не болғанын көрсетеді де, қалып қойған әрекеттерді не істеу
 * керегін СҰРАЙДЫ. Жүйе оларды өзі көшірмейді, өзі жаппайды —
 * жоспарды адам басқарады (CLAUDE.md §5.2a).
 *
 * ⚠ Макеттегі «келесі аптаға таңдау» блогы жоқ. Ол жоспарланбаған
 * әрекеттер қоймасы бар деп болжайды, ал бұл модельде әрбір әрекеттің
 * өз күні бар: таңдайтын қойма жоқ.
 *
 * ‹ › арқылы өткен апталарды қарауға болады, болашақ аптаға өтуге
 * болмайды: әлі болмаған нәрсенің қорытындысы жоқ.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter, centered } from '../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useBreakpoint } from '../lib/breakpoints';
import { weekNumber } from '../lib/calendar';
import { fmtMinutes, startOfWeek, addDays } from '../lib/report';
import {
  useWeekSummary, useMoveAction, useDropAction, useRootIdOf,
  useWeekLesson, useSaveWeekLesson,
} from '../lib/week';
import { Card, DarkCard, SectionLabel } from '../components/ui';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, ClockIcon } from '../components/icons';

export default function WeekScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const now = new Date();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const rep = useWeekSummary(weekStart, now);
  const { data: lesson } = useWeekLesson(rep.from, rep.to);
  const rootIdOf = useRootIdOf();
  const move = useMoveAction();
  const drop = useDropAction();
  const saveLesson = useSaveWeekLesson();

  // Апта ауысқанда сол аптаның сабағы өріске түседі
  useEffect(() => {
    setNote(lesson?.body ?? '');
    setSaved(false);
  }, [lesson?.id, rep.from.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = startOfWeek(now).getTime() === rep.from.getTime();
  const peak = Math.max(1, ...rep.trend.map((t) => t.pct));

  const moveToNextWeek = (id: string, date: string) => {
    setError(null);
    // Дәл бір аптадан кейінгі сол күн — апта ырғағы бұзылмайды
    const next = addDays(new Date(date + 'T00:00:00'), 7);
    move.mutate(
      { id, date: next, rootId: rootIdOf(id) },
      { onError: (e) => setError(errorText(e)) },
    );
  };

  const saveNote = () => {
    const body = note.trim();
    if (!body) return;
    setError(null);

    // ⚠ Бар болса ЖАҢАРТЫЛАДЫ: бір аптаға бір ғана сабақ
    saveLesson.mutate(
      { id: lesson?.id ?? null, body },
      { onSuccess: () => setSaved(true), onError: (e) => setError(errorText(e)) },
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...centered,
        paddingTop: insets.top + (wide ? 18 : 12),
        paddingBottom: insets.bottom + 28,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.week.title}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.body}>
        {/* ── Апта ауыстырғышы ── */}
        <View style={styles.nav}>
          <Pressable
            onPress={() => setWeekStart((w) => addDays(w, -7))}
            style={styles.arrow}
            accessibilityRole="button"
            accessibilityLabel={kk.week.prev}
          >
            <ChevronLeftIcon size={14} color={C.ink3} strokeWidth={2.4} />
          </Pressable>

          <Text style={styles.navTitle}>
            {tpl(kk.week.range, {
              n: weekNumber(rep.from),
              from: formatDayMonth(rep.from),
              to: formatDayMonth(rep.to),
            })}
          </Text>

          <Pressable
            onPress={() => rep.canGoNext && setWeekStart((w) => addDays(w, 7))}
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
            {/* ── Аптаның пайызы ── */}
            <DarkCard style={styles.hero}>
              <View style={styles.heroRow}>
                <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                  <Text style={styles.heroLabel}>
                    {current ? kk.week.thisWeek : kk.week.done}
                  </Text>

                  <View style={styles.bigRow}>
                    <Text style={styles.big}>{rep.pct}%</Text>
                    {rep.delta != null && rep.delta !== 0 && (
                      <Text
                        style={[
                          styles.delta,
                          { color: rep.delta > 0 ? C.accent2 : C.darkInk3 },
                        ]}
                      >
                        {rep.delta > 0 ? '+' : '−'}
                        {Math.abs(rep.delta)}%
                      </Text>
                    )}
                  </View>

                  <Text style={styles.heroSub}>
                    {rep.delta == null
                      ? kk.week.noCompare
                      : tpl(kk.week.prevWas, { pct: rep.prevPct })}
                  </Text>
                </View>

                {/* Серпін — соңғы бірнеше апта */}
                <View style={styles.trend}>
                  {rep.trend.map((t) => (
                    <View
                      key={t.key}
                      style={[
                        styles.trendBar,
                        { height: Math.max(Math.round((t.pct / peak) * 54), 4) },
                        t.current && { backgroundColor: C.accent },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </DarkCard>

            {/* ── Сандар ── */}
            <View style={styles.tiles}>
              <Card level="cardSm" radius={R.cardSm} style={styles.tile}>
                <View style={styles.tileHead}>
                  <CheckIcon size={13} color={C.accent} strokeWidth={3.2} />
                  <SectionLabel>{kk.week.done}</SectionLabel>
                </View>
                <Text style={styles.tileValue}>{rep.done}</Text>
              </Card>

              <Card level="cardSm" radius={R.cardSm} style={styles.tile}>
                <View style={styles.tileHead}>
                  <ClockIcon size={13} color={C.ink3} strokeWidth={2.6} />
                  <SectionLabel>{kk.week.missed}</SectionLabel>
                </View>
                <Text style={[styles.tileValue, { color: C.ink3 }]}>
                  {rep.missed.length}
                </Text>
              </Card>
            </View>

            {/* ── Фокус пен әдеттер ── */}
            <Card style={styles.pad}>
              <View style={styles.line}>
                <Text style={styles.lineLabel}>{kk.week.focus}</Text>
                <Text style={styles.lineValue}>
                  {rep.focusMinutes > 0 ? fmtMinutes(rep.focusMinutes) : '—'}
                </Text>
              </View>
              <View style={[styles.line, styles.lineTop]}>
                <Text style={styles.lineLabel}>{kk.week.habits}</Text>
                <Text style={styles.lineValue}>
                  {rep.habitPlanned > 0 ? `${rep.habitDone} / ${rep.habitPlanned}` : '—'}
                </Text>
              </View>
              {rep.ahead > 0 && (
                <View style={[styles.line, styles.lineTop]}>
                  <Text style={styles.lineLabel}>{kk.week.ahead}</Text>
                  <Text style={styles.lineValue}>{rep.ahead}</Text>
                </View>
              )}
            </Card>

            {/* ── Қалып қойғандар ── */}
            {rep.missed.length > 0 && (
              <>
                <SectionLabel style={{ paddingLeft: 4 }}>{kk.week.whatNext}</SectionLabel>

                <Card style={styles.pad}>
                  {rep.missed.map((a, i) => (
                    <View key={a.id} style={[styles.slip, i > 0 && styles.lineTop]}>
                      <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                        <Text style={styles.slipTitle} numberOfLines={2}>
                          {a.title}
                        </Text>
                        <View style={styles.slipMeta}>
                          <Text style={styles.slipDate}>
                            {formatDayMonth(new Date(a.date + 'T00:00:00'))}
                          </Text>
                          {a.goal && (
                            <View style={styles.goalChip}>
                              <View style={[styles.dot, { backgroundColor: a.goal.color }]} />
                              <Text style={styles.goalText} numberOfLines={1}>
                                {a.goal.title}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.slipBtns}>
                        <Pressable
                          onPress={() => moveToNextWeek(a.id, a.date)}
                          disabled={move.isPending}
                          style={[styles.btn, styles.btnMove]}
                          accessibilityRole="button"
                        >
                          <Text style={styles.btnMoveText}>{kk.week.moveOn}</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => drop.mutate(a.id)}
                          disabled={drop.isPending}
                          style={styles.btn}
                          accessibilityRole="button"
                        >
                          <Text style={styles.btnText}>{kk.week.close}</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}

                  <Text style={styles.hint}>{kk.week.closeHint}</Text>
                </Card>
              </>
            )}

            {/* ── Аптаның сабағы ── */}
            <SectionLabel style={{ paddingLeft: 4 }}>{kk.week.lesson}</SectionLabel>

            <Card style={styles.pad}>
              <TextInput
                value={note}
                onChangeText={(v) => {
                  setNote(v);
                  setSaved(false);
                }}
                placeholder={kk.week.lessonPlaceholder}
                placeholderTextColor={C.ink4}
                multiline
                textAlignVertical="top"
                style={styles.textarea}
              />

              <Pressable
                onPress={saveNote}
                disabled={!note.trim() || saveLesson.isPending}
                style={[
                  styles.save,
                  (!note.trim() || saveLesson.isPending) && { opacity: 0.45 },
                ]}
                accessibilityRole="button"
              >
                {saveLesson.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveText}>{kk.week.saveLesson}</Text>
                )}
              </Pressable>

              {saved && <Text style={styles.ok}>{kk.week.lessonSaved}</Text>}
            </Card>

            {error && <Text style={styles.error}>{error}</Text>}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: font.display, fontSize: 12, letterSpacing: 1.8, color: C.ink,
  },

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  center: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, textAlign: 'center' },

  nav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 30, height: 30, borderRadius: R.boxSm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.lineField,
  },
  navTitle: {
    flexGrow: 1, textAlign: 'center',
    fontFamily: font.bold, fontSize: 12.5, color: C.ink,
  },

  hero: { padding: 18 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  heroLabel: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.accent2,
  },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 8 },
  big: {
    fontFamily: font.display, fontSize: 36, letterSpacing: -1.8, color: '#FFFFFF',
  },
  delta: { fontFamily: font.bold, fontSize: 12 },
  heroSub: { fontFamily: font.prose, fontSize: 11, color: C.darkInk2, marginTop: 6 },

  trend: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 54, flexShrink: 0 },
  trendBar: { width: 13, borderRadius: R.micro, backgroundColor: C.darkCard2 },

  tiles: { flexDirection: 'row', gap: 9 },
  tile: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingHorizontal: 15, paddingVertical: 13 },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  tileValue: {
    fontFamily: font.display, fontSize: 22, letterSpacing: -0.9,
    color: C.ink, marginTop: 6,
  },

  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 9 },
  lineTop: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  lineLabel: { fontFamily: font.body, fontSize: 12.5, color: C.inkBody, flexShrink: 1 },
  lineValue: { fontFamily: font.bold, fontSize: 13, color: C.ink, flexShrink: 0 },

  slip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  slipTitle: { fontFamily: font.title, fontSize: 12.5, lineHeight: 17, color: C.ink },
  slipMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  slipDate: { fontFamily: font.body, fontSize: 10.5, color: C.ink4 },
  goalChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.tint, borderRadius: R.pill,
    paddingHorizontal: 8, paddingVertical: 2, flexShrink: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 999, flexShrink: 0 },
  goalText: { fontFamily: font.bold, fontSize: 9.5, color: C.accentDeep, flexShrink: 1 },

  slipBtns: { flexDirection: 'row', gap: 5, flexShrink: 0 },
  btn: {
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: R.chipSm,
    backgroundColor: C.cardSoft, borderWidth: 1.5, borderColor: C.line,
  },
  btnText: { fontFamily: font.bold, fontSize: 10.5, color: C.ink3 },
  btnMove: { backgroundColor: C.tintSoft, borderColor: C.tintLine },
  btnMoveText: { fontFamily: font.bold, fontSize: 10.5, color: C.accentDeep },

  hint: { fontFamily: font.prose, fontSize: 11, lineHeight: 16, color: C.ink4, marginTop: 12 },

  textarea: {
    minHeight: 84,
    borderWidth: 1.5, borderColor: C.lineField, borderRadius: R.cardXs,
    paddingHorizontal: 13, paddingVertical: 12,
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.ink,
    outlineStyle: 'none' as never,
  },
  save: {
    marginTop: 12, height: 46, borderRadius: R.sm, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  saveText: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },
  ok: { fontFamily: font.bold, fontSize: 11.5, color: C.accentDeep, marginTop: 10, textAlign: 'center' },
});
