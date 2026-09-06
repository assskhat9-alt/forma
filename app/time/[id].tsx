/**
 * УАҚЫТ ЕСЕБІ — бір мақсат.
 *
 * Телефондағы экран уақыты сияқты: Апта / Ай ауыстырғышы, күндік
 * бағаналар, күніне орташа және өткен кезеңмен салыстыру. ‹ › арқылы
 * кез келген өткен аптаны не айды ашуға болады.
 *
 * ⚠ Болашақ кезеңге өтуге болмайды: әлі болмаған нәрсенің есебі жоқ.
 *
 * ⚠ Бұл уақыт мақсаттың пайызына кірмейді (CLAUDE.md §1).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, formatDayMonth, monthsUpper } from '../../i18n/kk';
import { goBack } from '../../lib/nav';
import { errorText } from '../../lib/errors';
import { useBreakpoint } from '../../lib/breakpoints';
import { useGoals } from '../../lib/goals';
import {
  useGoalPeriod, useGoalTotal, fmtMinutes, fmtShort,
  startOfWeek, startOfMonth, addDays, type PeriodMode,
} from '../../lib/report';
import { Card, DarkCard, SectionLabel, Segments } from '../../components/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';

const MODES: PeriodMode[] = ['week', 'month'];
const CHART_H = 132;

export default function GoalTimeScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const now = new Date();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goals } = useGoals();
  const goal = (goals ?? []).find((g) => g.id === id) ?? null;

  const [modeIndex, setModeIndex] = useState(0);
  const mode = MODES[modeIndex]!;

  /** Қай кезеңді көрсетіп тұр — ‹ › осыны жылжытады */
  const [anchor, setAnchor] = useState(() => now);

  const rep = useGoalPeriod(id ?? null, mode, anchor, now);
  const allTime = useGoalTotal(id ?? null, now);

  const peak = Math.max(1, ...rep.bars.map((b) => b.minutes));

  /** Кезеңді бір саты кері не алға жылжыту */
  const shift = (n: number) =>
    setAnchor((a) =>
      mode === 'week'
        ? addDays(startOfWeek(a), n * 7)
        : new Date(a.getFullYear(), a.getMonth() + n, 1),
    );

  const current =
    mode === 'week'
      ? startOfWeek(now).getTime() === rep.from.getTime()
      : startOfMonth(now).getTime() === rep.from.getTime();

  const title =
    mode === 'week'
      ? `${formatDayMonth(rep.from)} — ${formatDayMonth(rep.to)}`
      : `${cap(monthsUpper[rep.from.getMonth()]!)} ${rep.from.getFullYear()}`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...centered,
        paddingTop: insets.top + (wide ? 18 : 12),
        paddingBottom: insets.bottom + 28,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      // ⚠ Сан пернетақтасында «Дайын» түймесі жоқ — тізімді сүйреп жабады
      keyboardDismissMode="on-drag"
    >
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/time')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {goal?.title ?? kk.time.title}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.body}>
        {/* Мақсаттың бүкіл уақыты — кезеңнен бөлек, өзгермейтін сан */}
        <DarkCard style={styles.hero}>
          <Text style={styles.heroLabel}>{kk.time.goalTotal}</Text>
          <Text style={styles.heroValue}>{allTime > 0 ? fmtMinutes(allTime) : '—'}</Text>
        </DarkCard>

        <Segments
          items={[kk.time.weekMode, kk.time.monthMode]}
          index={modeIndex}
          onChange={(i) => {
            setModeIndex(i);
            // Кезең түрі ауысқанда бүгінге қайтамыз: қырық апта кері
            // кеткен жерден айға өту адасуға апарады
            setAnchor(now);
          }}
        />

        {/* ── Кезең ауыстырғышы ── */}
        <Card style={styles.pad}>
          <View style={styles.periodHead}>
            <Pressable
              onPress={() => shift(-1)}
              style={styles.arrow}
              accessibilityRole="button"
              accessibilityLabel={kk.time.prev}
            >
              <ChevronLeftIcon size={14} color={C.ink3} strokeWidth={2.4} />
            </Pressable>

            <View style={{ flexGrow: 1, alignItems: 'center' }}>
              <Text style={styles.periodTitle}>{title}</Text>
              {current && <Text style={styles.periodNow}>{kk.time.now}</Text>}
            </View>

            <Pressable
              onPress={() => rep.canGoNext && shift(1)}
              disabled={!rep.canGoNext}
              style={[styles.arrow, !rep.canGoNext && { opacity: 0.3 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.time.next}
            >
              <ChevronRightIcon size={14} color={C.ink3} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.totalRow}>
            <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
              <Text style={styles.totalLabel}>{kk.time.perDay}</Text>
              <View style={styles.bigRow}>
                <Text style={styles.big}>
                  {rep.total > 0 ? fmtMinutes(rep.perDay) : '—'}
                </Text>
                {rep.delta != null && rep.delta !== 0 && (
                  <Text
                    style={[styles.delta, { color: rep.delta > 0 ? C.accentDeep : C.ink3 }]}
                  >
                    {rep.delta > 0 ? '+' : '−'}
                    {fmtMinutes(Math.abs(rep.delta))}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.sumBox}>
              <Text style={styles.sumLabel}>{kk.time.periodTotal}</Text>
              <Text style={styles.sumValue}>
                {rep.total > 0 ? fmtMinutes(rep.total) : '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.sub}>
            {rep.delta == null
              ? kk.time.noCompare
              : `${mode === 'week' ? kk.time.prevWeekWas : kk.time.prevMonthWas} ${fmtMinutes(rep.prevTotal)}`}
          </Text>

          {/* ── Күндік бағаналар ── */}
          {rep.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : rep.isError ? (
            <Text style={styles.error}>{errorText(rep.error)}</Text>
          ) : (
            <View style={[styles.chart, mode === 'month' && { gap: 2 }]}>
              {rep.bars.map((b) => {
                const h = Math.max(
                  Math.round((b.minutes / peak) * (CHART_H - 30)),
                  b.minutes ? 5 : 3,
                );
                return (
                  <View key={b.key} style={styles.col}>
                    {/* Айда бағана көп — үстіне сан сыймайды */}
                    {mode === 'week' && (
                      <Text style={[styles.colTop, b.today && { color: C.accentDeep }]}>
                        {fmtShort(b.minutes)}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.bar,
                        mode === 'month' && { maxWidth: 14, borderRadius: R.micro },
                        { height: h },
                        b.minutes === 0 && { backgroundColor: C.lineSoft },
                        b.today && b.minutes > 0 && { backgroundColor: C.accentDeep },
                      ]}
                    />
                    <Text style={[styles.colLabel, b.today && styles.colLabelOn]}>
                      {b.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* ── Қай әрекетке қанша ── */}
        <SectionLabel style={{ paddingLeft: 4 }}>{kk.time.byAction}</SectionLabel>

        <Card style={styles.pad}>
          {rep.actions.length === 0 ? (
            <Text style={styles.empty}>{kk.time.emptyPeriod}</Text>
          ) : (
            rep.actions.map((a, i) => (
              <View key={a.id} style={[styles.actionRow, i > 0 && styles.line]}>
                <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                  <Text style={styles.actionName} numberOfLines={1}>
                    {a.title}
                  </Text>
                  {a.date && (
                    <Text style={styles.actionDate}>
                      {formatDayMonth(new Date(a.date + 'T00:00:00'))}
                    </Text>
                  )}
                </View>

                <View style={styles.actionRight}>
                  <Text style={styles.actionTime}>{fmtMinutes(a.minutes)}</Text>
                  <View style={styles.miniTrack}>
                    <View
                      style={{
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: C.accent,
                        width: `${rep.total ? (a.minutes / rep.total) * 100 : 0}%`,
                      }}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        <Text style={styles.footer}>{kk.time.notCounted}</Text>
      </View>
    </ScrollView>
  );
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: font.bold, fontSize: 14, letterSpacing: -0.28,
    color: C.ink, flexShrink: 1,
  },

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  center: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, marginTop: 12 },
  empty: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.ink4 },

  hero: { paddingHorizontal: 18, paddingVertical: 15 },
  heroLabel: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.accent2,
  },
  heroValue: {
    fontFamily: font.display, fontSize: 24, letterSpacing: -1,
    color: '#FFFFFF', marginTop: 7,
  },

  periodHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 30, height: 30, borderRadius: R.boxSm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardSoft, borderWidth: 1, borderColor: C.lineField,
  },
  periodTitle: { fontFamily: font.bold, fontSize: 13.5, color: C.ink },
  periodNow: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 0.9,
    color: C.accent, marginTop: 2,
  },

  totalRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 12, marginTop: 14,
  },
  totalLabel: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.ink3,
  },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 5 },
  big: { fontFamily: font.display, fontSize: 25, letterSpacing: -1, color: C.ink },
  delta: { fontFamily: font.bold, fontSize: 12 },

  sumBox: {
    flexShrink: 0, alignItems: 'flex-end',
    backgroundColor: C.tintChip, borderRadius: R.cardXs,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  sumLabel: {
    fontFamily: font.bold, fontSize: 9, letterSpacing: 0.9,
    textTransform: 'uppercase', color: C.accentDeep,
  },
  sumValue: { fontFamily: font.bold, fontSize: 13.5, color: C.ink, marginTop: 3 },

  sub: { fontFamily: font.prose, fontSize: 11, color: C.inkMuted, marginTop: 8 },

  chart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 7,
    height: CHART_H, marginTop: 14,
  },
  col: {
    flexGrow: 1, flexShrink: 1, alignItems: 'center',
    justifyContent: 'flex-end', gap: 6, height: '100%',
  },
  colTop: { fontFamily: font.bold, fontSize: 9, color: C.ink4 },
  bar: {
    width: '100%', maxWidth: 40, borderRadius: R.boxSm, backgroundColor: C.accent,
  },
  colLabel: { fontFamily: font.body, fontSize: 9.5, color: C.inkMuted },
  colLabelOn: { fontFamily: font.bold, color: C.accentDeep },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  line: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  actionName: { fontFamily: font.title, fontSize: 13, color: C.ink },
  actionDate: { fontFamily: font.body, fontSize: 11, color: C.ink4, marginTop: 3 },
  actionRight: { width: 96, flexShrink: 0, alignItems: 'flex-end', gap: 6 },
  actionTime: { fontFamily: font.bold, fontSize: 12.5, color: C.ink },
  miniTrack: {
    width: '100%', height: 4, borderRadius: 999,
    backgroundColor: C.tintBar, overflow: 'hidden',
  },

  footer: {
    fontFamily: font.prose, fontSize: 11, lineHeight: 16,
    color: C.ink4, textAlign: 'center', marginTop: 4, paddingHorizontal: 10,
  },
});
