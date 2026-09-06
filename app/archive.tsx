/**
 * АРХИВ (design/Arhiv.dc.html).
 *
 * Аяқталған мен жабылғанның тарихы: сандар, ай сайынғы орындалу және
 * әр істің қасындағы рефлексия.
 *
 * ⚠ Мұнда ештеңе өзгертілмейді. Архив — өткенді көрсететін терезе.
 * Істі қайта ашу да, жоюға да болмайды: тарихты кейін түзету оны
 * жалғанға айналдырады.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter, centered } from '../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useBreakpoint } from '../lib/breakpoints';
import { useArchive, type ArchiveKind } from '../lib/archive';
import { Card, SectionLabel } from '../components/ui';
import { ChevronLeftIcon, CheckIcon, CloseIcon, ChatIcon } from '../components/icons';

const FILTERS: { key: ArchiveKind; name: string }[] = [
  { key: 'all', name: kk.archive.filters.all },
  { key: 'action', name: kk.archive.filters.actions },
  { key: 'goal', name: kk.archive.filters.goals },
  { key: 'dropped', name: kk.archive.filters.dropped },
];

/** Тізім бірден толық жүктелмейді — архив жылдар бойы өседі */
const PAGE = 30;

const CHART_H = 78;

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const now = new Date();

  const [filter, setFilter] = useState(0);
  const [limit, setLimit] = useState(PAGE);

  const kind = FILTERS[filter]!.key;
  const rep = useArchive(kind, now);

  const peak = Math.max(1, ...rep.bars.map((b) => b.pct));
  const shown = rep.entries.slice(0, limit);

  const levelName = (level: string, dropped: boolean) =>
    dropped
      ? kk.archive.droppedChip
      : level === 'day'
        ? kk.archive.levelAction
        : level === 'month'
          ? kk.archive.levelMonth
          : kk.archive.levelYear;

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
        <Pressable onPress={() => goBack('/')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.archive.title}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.body}>
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
            {/* ── Сандар ── */}
            <View style={styles.tiles}>
              <Tile value={rep.doneActions} label={kk.archive.stats.tasks} />
              <Tile value={rep.reflections} label={kk.archive.stats.reflections} />
              <Tile value={`${rep.average}%`} label={kk.archive.stats.average} />
            </View>

            {/* ── Ай сайынғы орындалу ── */}
            <Card style={styles.pad}>
              <View style={styles.chartHead}>
                <SectionLabel>{kk.archive.monthly}</SectionLabel>
                <Text style={styles.avg}>{tpl(kk.archive.average, { pct: rep.average })}</Text>
              </View>

              <View style={styles.chart}>
                {rep.bars.map((b) => (
                  <View key={b.key} style={styles.col}>
                    <Text style={styles.colTop}>{b.total ? `${b.pct}%` : '—'}</Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(
                            Math.round((b.pct / peak) * (CHART_H - 28)),
                            b.total ? 5 : 3,
                          ),
                        },
                        // Дерегі жоқ ай — бос із, нөл емес
                        b.total === 0 && { backgroundColor: C.lineSoft },
                      ]}
                    />
                    <Text style={styles.colLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* ── Сүзгілер ── */}
            <View style={styles.filters}>
              {FILTERS.map((f, i) => {
                const on = filter === i;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => {
                      setFilter(i);
                      setLimit(PAGE);
                    }}
                    style={[styles.chip, on && styles.chipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipText, on && { color: '#FFFFFF' }]}>
                      {f.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Жазбалар ── */}
            {shown.length === 0 ? (
              <Card style={styles.pad}>
                <Text style={styles.empty}>{kk.archive.empty}</Text>
              </Card>
            ) : (
              shown.map((e) => (
                <Card key={e.id} level="cardSm" radius={R.cardSm} style={styles.entry}>
                  <View style={styles.entryHead}>
                    <View style={[styles.mark, e.dropped && styles.markOff]}>
                      {e.dropped ? (
                        <CloseIcon size={10} color={C.ink3} />
                      ) : (
                        <CheckIcon size={11} color="#FFFFFF" strokeWidth={3.6} />
                      )}
                    </View>

                    <Text
                      style={[styles.entryTitle, e.dropped && styles.entryOff]}
                      numberOfLines={2}
                    >
                      {e.title}
                    </Text>

                    <Text style={styles.entryDate}>
                      {formatDayMonth(new Date(e.date + 'T00:00:00'))}
                    </Text>
                  </View>

                  <View style={styles.meta}>
                    <View style={[styles.levelChip, e.dropped && styles.levelChipOff]}>
                      <Text style={[styles.levelText, e.dropped && { color: C.ink3 }]}>
                        {levelName(e.level, e.dropped)}
                      </Text>
                    </View>

                    {e.goal && (
                      <View style={styles.goalChip}>
                        <View style={[styles.dot, { backgroundColor: e.goal.color }]} />
                        <Text style={styles.goalText} numberOfLines={1}>
                          {e.goal.title}
                        </Text>
                      </View>
                    )}

                    {e.mood != null && (
                      <Text style={styles.mood}>{kk.reflection.moods[e.mood - 1]}</Text>
                    )}
                  </View>

                  {e.note && (
                    <View style={styles.note}>
                      <ChatIcon size={13} color={C.accent5} strokeWidth={2.2} />
                      <Text style={styles.noteText}>{e.note}</Text>
                    </View>
                  )}
                </Card>
              ))
            )}

            {rep.entries.length > shown.length && (
              <Pressable
                onPress={() => setLimit((n) => n + PAGE)}
                style={styles.more}
                accessibilityRole="button"
              >
                <Text style={styles.moreText}>
                  {tpl(kk.archive.more, { n: rep.entries.length - shown.length })}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Tile({ value, label }: { value: number | string; label: string }) {
  return (
    <Card level="cardSm" radius={R.cardSm} style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Card>
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

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  center: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 13, color: C.inkProse },
  empty: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.ink4 },

  tiles: { flexDirection: 'row', gap: 9 },
  tile: {
    flexGrow: 1, flexShrink: 1, flexBasis: 0,
    paddingHorizontal: 12, paddingVertical: 14,
  },
  tileValue: {
    fontFamily: font.display, fontSize: 21, letterSpacing: -0.84, color: C.ink,
  },
  tileLabel: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 0.4, lineHeight: 13,
    textTransform: 'uppercase', color: C.ink3, marginTop: 6,
  },

  chartHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10,
  },
  avg: { fontFamily: font.bold, fontSize: 11, color: C.accent },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 7,
    height: CHART_H, marginTop: 14,
  },
  col: {
    flexGrow: 1, flexShrink: 1, alignItems: 'center',
    justifyContent: 'flex-end', gap: 6, height: '100%',
  },
  colTop: { fontFamily: font.bold, fontSize: 9, color: C.ink4 },
  bar: { width: '100%', maxWidth: 34, borderRadius: R.micro, backgroundColor: C.accent },
  colLabel: { fontFamily: font.bold, fontSize: 8.5, color: C.ink4 },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: R.pill,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line,
  },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontFamily: font.bold, fontSize: 11.5, color: C.inkMuted },

  entry: { paddingHorizontal: 15, paddingVertical: 14 },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: {
    width: 20, height: 20, borderRadius: R.micro, flexShrink: 0,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
  },
  markOff: { backgroundColor: C.cardSoft, borderWidth: 1.5, borderColor: C.line },
  entryTitle: {
    fontFamily: font.bold, fontSize: 12.5, letterSpacing: -0.13,
    color: C.ink, flexGrow: 1, flexShrink: 1,
  },
  entryOff: { color: C.inkMuted },
  entryDate: { fontFamily: font.body, fontSize: 10, color: C.ink4, flexShrink: 0 },

  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  levelChip: {
    backgroundColor: C.tint, borderRadius: R.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  levelChipOff: { backgroundColor: C.cardSoft },
  levelText: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 0.5,
    textTransform: 'uppercase', color: C.accentDeep,
  },
  goalChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.cardSoft, borderRadius: R.pill,
    paddingHorizontal: 8, paddingVertical: 3, flexShrink: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 999, flexShrink: 0 },
  goalText: { fontFamily: font.bold, fontSize: 9.5, color: C.inkBody, flexShrink: 1 },
  mood: { fontFamily: font.bold, fontSize: 9.5, color: C.inkMuted },

  note: {
    flexDirection: 'row', gap: 9, marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.lineSoft,
  },
  noteText: {
    fontFamily: font.prose, fontSize: 11.5, lineHeight: 17,
    color: C.inkProse, flexShrink: 1,
  },

  more: {
    height: 44, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.tintSoft, borderWidth: 1.5, borderColor: C.tintLine,
  },
  moreText: { fontFamily: font.bold, fontSize: 12.5, color: C.accentDeep },
});
