/**
 * Планшет пен ПК-дегі ай торы.
 *
 * CLAUDE.md §7.1: мұнда тор ЖИЫРЫЛМАЙДЫ — тек тарылады. Бланка оң жақтан
 * сырғып шығады, календарь орнында қалады.
 *
 * Ұяшық биіктігі икемді (қалған орынды бөліп алады), сондықтан күндегі
 * тапсырмалар нүкте емес, атауы көрінетін чип болып шығады.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { isSameDay } from 'date-fns';

import { color as C, radius as R, font } from '../../theme/tokens';
import { weekdaysFull, weekdaysShort } from '../../i18n/kk';
import { type DayCell, COLS } from '../../lib/calendar';
import type { DayLoad } from '../../lib/goals';

type Props = {
  cells: DayCell[];
  selected: Date;
  onSelect: (d: Date) => void;
  loadOf: (d: Date) => DayLoad | null;
  /** Ұяшыққа сыятын чип саны — енге қарай өзгереді */
  maxChips?: number;
  /** Толық күн атауы тек кең экранда */
  longWeekdays?: boolean;
};

export function MonthGridWide({
  cells,
  selected,
  onSelect,
  loadOf,
  maxChips = 2,
  longWeekdays = true,
}: Props) {
  const names = longWeekdays ? weekdaysFull : weekdaysShort;

  return (
    <View style={styles.card}>
      <View style={styles.weekdays}>
        {names.map((w, i) => (
          <Text key={w} style={[styles.weekday, i > 4 && { color: C.inkIcon }]}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((c) => (
          <DayCellWide
            key={c.date.toISOString()}
            cell={c}
            selected={isSameDay(c.date, selected)}
            load={loadOf(c.date)}
            maxChips={maxChips}
            onPress={() => !c.outside && onSelect(c.date)}
          />
        ))}
      </View>
    </View>
  );
}

function DayCellWide({
  cell,
  selected,
  load,
  maxChips,
  onPress,
}: {
  cell: DayCell;
  selected: boolean;
  load: DayLoad | null;
  maxChips: number;
  onPress: () => void;
}) {
  const { outside, isToday } = cell;

  const bg = selected ? C.tintRow : isToday ? C.tintSoft : '#FDFDFE';
  const border = selected ? C.accent : isToday ? C.accentLine : C.trackChip;
  const fg = outside ? C.inkOut : isToday || selected ? C.accentDeep : C.ink;

  const shown = load ? load.items.slice(0, maxChips) : [];
  const overflow = load ? load.total - shown.length : 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={outside}
      style={[styles.cell, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={styles.cellHead}>
        <Text
          style={[
            styles.cellDay,
            { color: fg, fontFamily: isToday || selected ? font.bold : font.body },
          ]}
        >
          {cell.date.getDate()}
        </Text>
        {overflow > 0 && (
          <Text style={[styles.more, { color: selected ? C.accentDeep : C.ink4 }]}>
            +{overflow}
          </Text>
        )}
      </View>

      {shown.map((it, i) => (
        <View
          key={i}
          style={[styles.chip, { backgroundColor: selected ? C.card : C.trackHabit }]}
        >
          <View style={[styles.chipDot, { backgroundColor: it.color }]} />
          <Text style={styles.chipText} numberOfLines={1}>
            {it.title}
          </Text>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    minHeight: 0,
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#14142D',
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  weekdays: { flexDirection: 'row', marginBottom: 7 },
  weekday: {
    flexGrow: 1,
    flexBasis: 0,
    textAlign: 'center',
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.57,
    color: C.ink3,
  },
  grid: {
    flexGrow: 1,
    minHeight: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / COLS}%`,
    // 6 жол — әрқайсысы биіктіктің алтыдан бірін алады
    height: `${100 / 6}%`,
    borderRadius: R.sm,
    borderWidth: 1.5,
    paddingHorizontal: 5,
    paddingVertical: 6,
    gap: 3,
    overflow: 'hidden',
  },
  cellHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cellDay: { fontSize: 12 },
  more: { fontFamily: font.bold, fontSize: 8.5 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: R.micro2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  chipDot: { width: 4, height: 4, borderRadius: 999, flexShrink: 0 },
  chipText: { fontFamily: font.title, fontSize: 8.5, color: C.ink2, flexShrink: 1 },
});
