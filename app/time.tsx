/**
 * УАҚЫТ ЕСЕБІ (design/Uaqyt.dc.html).
 *
 * Фокус таймері жинаған уақыттың қорытындысы: кезең бойынша жалпы сан,
 * бағаналы диаграмма және мақсаттар бойынша бөлінісі.
 *
 * ⚠ Бұл экран ЕШТЕҢЕ БОЛЖАМАЙДЫ. Барлық сан — жазылған сессиялардың
 * қосындысы. Салыстыруға алдыңғы кезеңнің деректері жетпесе, айырма
 * көрсетілмейді.
 *
 * ⚠ Мұндағы уақыт мақсаттың ПАЙЫЗЫНА қатыспайды: пайыз орындалған
 * әрекеттен есептеледі, отырған сағаттан емес (CLAUDE.md §1).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter, centered } from '../theme/tokens';
import { kk, formatDayMonth } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useBreakpoint } from '../lib/breakpoints';
import {
  useTimeReport, fmtMinutes, fmtShort, type ReportRange,
} from '../lib/report';
import { Card, SectionLabel, Segments } from '../components/ui';
import { ChevronLeftIcon } from '../components/icons';

const RANGES: { key: ReportRange; name: string }[] = [
  { key: 'day', name: kk.time.day },
  { key: 'week', name: kk.time.week },
  { key: 'month', name: kk.time.month },
];

/** Диаграмманың биіктігі */
const CHART_H = 148;

export default function TimeScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const today = new Date();

  const [rangeIndex, setRangeIndex] = useState(1);
  /** Таңдалған бағана — тізім соған қарай сүзіледі. −1 = бәрі */
  const [picked, setPicked] = useState(-1);

  const range = RANGES[rangeIndex]!.key;
  const rep = useTimeReport(range, today);

  const peak = Math.max(1, ...rep.bars.map((b) => b.minutes));

  // Бағана таңдалса — тізім соның ішіндегі бөлінісін көрсетеді
  const bar = picked >= 0 ? rep.bars[picked] : null;
  const listTotal = bar ? bar.minutes : rep.total;
  const list = bar
    ? bar.segments
        .map((s) => ({
          id: s.id,
          title: rep.goals.find((g) => g.id === s.id)?.title ?? '—',
          color: s.color,
          minutes: s.minutes,
          pct: bar.minutes ? Math.round((s.minutes / bar.minutes) * 100) : 0,
        }))
        .sort((a, b) => b.minutes - a.minutes)
    : rep.goals;

  const scope =
    range === 'day'
      ? kk.time.scopeDay
      : `${formatDayMonth(rep.from)} — ${formatDayMonth(rep.to)}`;

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
        <Pressable onPress={() => goBack('/focus')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.time.title}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.body}>
        <Segments
          items={RANGES.map((r) => r.name)}
          index={rangeIndex}
          onChange={(i) => {
            setRangeIndex(i);
            setPicked(-1);
          }}
        />

        {rep.isError ? (
          <Card style={styles.pad}>
            <Text style={styles.error}>{errorText(rep.error)}</Text>
          </Card>
        ) : rep.isLoading ? (
          <Card style={styles.pad}>
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          </Card>
        ) : (
          <>
            {/* ── Жалпы ── */}
            <Card style={styles.pad}>
              <View style={styles.totalRow}>
                <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                  <SectionLabel>{scope}</SectionLabel>

                  <View style={styles.bigRow}>
                    <Text style={styles.big}>
                      {rep.total > 0 ? fmtMinutes(rep.total) : '—'}
                    </Text>
                    {rep.delta != null && rep.delta !== 0 && (
                      <Text
                        style={[
                          styles.delta,
                          { color: rep.delta > 0 ? C.accentDeep : C.ink3 },
                        ]}
                      >
                        {rep.delta > 0 ? '+' : '−'}
                        {fmtMinutes(Math.abs(rep.delta))}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.sub}>
                    {rep.delta == null
                      ? kk.time.noCompare
                      : `${kk.time.before} ${fmtMinutes(rep.prevTotal)}`}
                  </Text>
                </View>

                {/* Күндік есепте «күніне орташа» мағынасыз — сессия саны тұрады */}
                <View style={styles.avgBox}>
                  <Text style={styles.avgLabel}>
                    {rep.perDay == null ? kk.time.sessions : kk.time.perDay}
                  </Text>
                  <Text style={styles.avgValue}>
                    {rep.perDay == null ? rep.sessions : fmtMinutes(rep.perDay)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* ── Диаграмма ── */}
            <Card style={styles.pad}>
              <View style={styles.chartHead}>
                <SectionLabel>
                  {range === 'day'
                    ? kk.time.byHour
                    : range === 'week'
                      ? kk.time.byDay
                      : kk.time.byWeek}
                </SectionLabel>
                <Text style={styles.hint}>{kk.time.tapHint}</Text>
              </View>

              {rep.total === 0 ? (
                <Text style={styles.empty}>{kk.time.empty}</Text>
              ) : (
                <View style={styles.chart}>
                  {rep.bars.map((b, i) => {
                    const on = picked === -1 || picked === i;
                    const h = Math.max(Math.round((b.minutes / peak) * (CHART_H - 30)), b.minutes ? 6 : 3);

                    return (
                      <Pressable
                        key={b.key}
                        onPress={() => setPicked(picked === i ? -1 : i)}
                        style={styles.col}
                        accessibilityRole="button"
                        accessibilityLabel={`${b.label}: ${fmtMinutes(b.minutes)}`}
                        accessibilityState={{ selected: picked === i }}
                      >
                        <Text style={[styles.colTop, picked === i && { color: C.accentDeep }]}>
                          {fmtShort(b.minutes)}
                        </Text>

                        <View style={[styles.bar, { height: h, opacity: on ? 1 : 0.32 }]}>
                          {b.minutes === 0 ? (
                            <View style={{ flexGrow: 1, backgroundColor: C.lineSoft }} />
                          ) : (
                            b.segments.map((s) => (
                              <View
                                key={s.id}
                                style={{
                                  // Қабаттың үлесі — пайызбен жазсақ RN типі қабылдамайды
                                  flexGrow: s.minutes,
                                  flexBasis: 0,
                                  backgroundColor: s.color,
                                }}
                              />
                            ))
                          )}
                        </View>

                        <Text style={[styles.colLabel, picked === i && { color: C.accentDeep }]}>
                          {b.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Card>

            {/* ── Мақсаттар бойынша ── */}
            <Card style={styles.pad}>
              <View style={styles.chartHead}>
                <SectionLabel>{kk.time.byGoal}</SectionLabel>
                {bar && (
                  <Pressable onPress={() => setPicked(-1)} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.clear}>
                      {bar.label} · {kk.time.showAll}
                    </Text>
                  </Pressable>
                )}
              </View>

              {list.length === 0 ? (
                <Text style={styles.empty}>{kk.time.empty}</Text>
              ) : (
                list.map((g, i) => (
                  <View key={g.id} style={[styles.goalRow, i > 0 && styles.goalLine]}>
                    <View style={[styles.dot, { backgroundColor: g.color }]} />

                    <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                      <View style={styles.goalHead}>
                        <Text style={styles.goalName} numberOfLines={1}>
                          {g.title}
                        </Text>
                        <Text style={styles.goalTime}>{fmtMinutes(g.minutes)}</Text>
                      </View>

                      <View style={styles.goalBarRow}>
                        <View style={styles.track}>
                          <View
                            style={{
                              height: 5,
                              borderRadius: 999,
                              backgroundColor: g.color,
                              width: `${listTotal ? (g.minutes / listTotal) * 100 : 0}%`,
                            }}
                          />
                        </View>
                        <Text style={styles.goalPct}>{g.pct}%</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </Card>

            <Text style={styles.footer}>{kk.time.notCounted}</Text>
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
    fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink,
  },

  body: { paddingHorizontal: gutter, gap: 11 },
  pad: { padding: 17 },
  center: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 13, color: C.inkProse },
  empty: {
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 19,
    color: C.ink4, marginTop: 12,
  },

  totalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 6 },
  big: {
    fontFamily: font.display, fontSize: 27, letterSpacing: -1.1, color: C.ink,
  },
  delta: { fontFamily: font.bold, fontSize: 12 },
  sub: { fontFamily: font.prose, fontSize: 11, color: C.inkMuted, marginTop: 6 },

  avgBox: {
    flexShrink: 0, alignItems: 'flex-end',
    backgroundColor: C.tintChip, borderRadius: R.cardXs,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  avgLabel: {
    fontFamily: font.bold, fontSize: 9, letterSpacing: 0.9,
    textTransform: 'uppercase', color: C.accentDeep,
  },
  avgValue: { fontFamily: font.bold, fontSize: 13.5, color: C.ink, marginTop: 3 },

  chartHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10,
  },
  hint: { fontFamily: font.bold, fontSize: 10, color: C.ink4, flexShrink: 1 },
  clear: { fontFamily: font.bold, fontSize: 10.5, color: C.accent },

  chart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 7,
    height: CHART_H, marginTop: 13,
  },
  col: {
    flexGrow: 1, flexShrink: 1, alignItems: 'center',
    justifyContent: 'flex-end', gap: 7, height: '100%',
  },
  colTop: { fontFamily: font.bold, fontSize: 9, color: C.ink4 },
  bar: {
    width: '100%', maxWidth: 46, borderRadius: R.boxSm,
    overflow: 'hidden', backgroundColor: C.tintBar,
  },
  colLabel: { fontFamily: font.bold, fontSize: 9, color: C.ink4 },

  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  goalLine: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  dot: { width: 9, height: 9, borderRadius: 999, flexShrink: 0 },
  goalHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 8,
  },
  goalName: { fontFamily: font.title, fontSize: 12.5, color: C.ink, flexShrink: 1 },
  goalTime: { fontFamily: font.bold, fontSize: 12.5, color: C.ink, flexShrink: 0 },
  goalBarRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 6 },
  track: {
    flexGrow: 1, height: 5, borderRadius: 999,
    backgroundColor: C.tintBar, overflow: 'hidden',
  },
  goalPct: {
    fontFamily: font.bold, fontSize: 10.5, color: C.inkMuted,
    width: 32, textAlign: 'right',
  },

  footer: {
    fontFamily: font.prose, fontSize: 11, lineHeight: 16,
    color: C.ink4, textAlign: 'center', marginTop: 4, paddingHorizontal: 10,
  },
});
