/**
 * Телефондағы ай торы.
 *
 * CLAUDE.md §7.1 — ЖЕҢІЛДЕТУГЕ БОЛМАЙТЫН өзара әрекет:
 * «Тапсырма қосу» дегенде календарь ЖОҒАЛМАЙДЫ. Ай торы таңдалған аптаға
 * дейін жиырылып, экранның жоғарғы жағында тұрып қалады. Бланка ашық
 * тұрғанда да басқа күнді басып, тапсырманың күнін ауыстыруға болады.
 *
 * Анимация: height 264 → 46, translateY(−жол × 44), 0.3s cubic-bezier(.4,0,.2,1)
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { isSameDay } from 'date-fns';

import { color as C, radius as R, font } from '../../theme/tokens';
import { weekdaysShort } from '../../i18n/kk';
import {
  type DayCell,
  COLS,
  PHONE_ROW_HEIGHT,
  PHONE_GRID_OPEN,
  PHONE_GRID_COLLAPSED,
  collapseOffset,
} from '../../lib/calendar';
import type { DayLoad } from '../../lib/goals';

const EASE = Easing.bezier(0.4, 0, 0.2, 1);
const DURATION = 300;

type Props = {
  cells: DayCell[];
  selected: Date;
  onSelect: (d: Date) => void;
  /** Жиырылған күй — бланка ашық тұрғанда */
  collapsed: boolean;
  /** Жиырылған торды басқанда қайта жайылады */
  onExpand: () => void;
  loadOf: (d: Date) => DayLoad | null;
};

export function MonthGridPhone({
  cells,
  selected,
  onSelect,
  collapsed,
  onExpand,
  loadOf,
}: Props) {
  const t = useSharedValue(collapsed ? 1 : 0);
  const y = useSharedValue(collapsed ? collapseOffset(cells, selected) : 0);
  const offset = collapseOffset(cells, selected);

  useEffect(() => {
    t.value = withTiming(collapsed ? 1 : 0, { duration: DURATION, easing: EASE });
  }, [collapsed, t]);

  // Жеке shared value: жиырылған күйде таңдау басқа жолға ауысса да сырғиды
  useEffect(() => {
    y.value = withTiming(collapsed ? offset : 0, { duration: DURATION, easing: EASE });
  }, [collapsed, offset, y]);

  const clip = useAnimatedStyle(() => ({
    height: PHONE_GRID_OPEN + t.value * (PHONE_GRID_COLLAPSED - PHONE_GRID_OPEN),
  }));

  const shift = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <View style={styles.card}>
      <View style={styles.weekdays}>
        {weekdaysShort.map((w, i) => (
          <Text key={w} style={[styles.weekday, i > 4 && { color: C.inkIcon }]}>
            {w}
          </Text>
        ))}
      </View>

      <Animated.View style={[styles.clip, clip]}>
        <Animated.View style={shift}>
          <View style={styles.grid}>
            {cells.map((c) => (
              <DayCellPhone
                key={c.date.toISOString()}
                cell={c}
                selected={isSameDay(c.date, selected)}
                load={loadOf(c.date)}
                onPress={() => !c.outside && onSelect(c.date)}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>

      {collapsed && (
        <Pressable
          onPress={onExpand}
          style={styles.handleZone}
          accessibilityRole="button"
          accessibilityLabel="Календарьды жаю"
        >
          <View style={styles.handle} />
        </Pressable>
      )}
    </View>
  );
}

function DayCellPhone({
  cell,
  selected,
  load,
  onPress,
}: {
  cell: DayCell;
  selected: boolean;
  load: DayLoad | null;
  onPress: () => void;
}) {
  const { outside, isToday } = cell;

  const bg = selected ? C.accent : isToday ? C.tintToday : 'transparent';
  const fg = selected
    ? '#FFFFFF'
    : outside
      ? C.inkOut
      : isToday
        ? C.accentDeep
        : C.ink;

  // Нүктелер: орындалғаны толық түсті, қалғаны бозғылт
  const dots: string[] = [];
  if (load && !outside) {
    for (let i = 0; i < Math.min(load.total, 3); i++) {
      const filled = i < load.done;
      dots.push(
        selected
          ? filled ? '#FFFFFF' : 'rgba(255,255,255,.42)'
          : filled ? C.accent : C.accentLine,
      );
    }
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={outside}
      style={[styles.cell, { backgroundColor: bg }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.cellDay, { color: fg, fontFamily: selected || isToday ? font.bold : font.body }]}>
        {cell.date.getDate()}
      </Text>
      <View style={styles.dots}>
        {dots.map((d, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: d }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.cardLg,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#14142D',
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  weekdays: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flexGrow: 1,
    flexBasis: 0,
    textAlign: 'center',
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.48,
    color: C.ink3,
  },
  clip: { overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / COLS}%`,
    height: PHONE_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: R.chipSm,
  },
  cellDay: { fontSize: 13 },
  dots: { flexDirection: 'row', gap: 2.5, height: 4 },
  dot: { width: 4, height: 4, borderRadius: 999 },
  handleZone: { alignItems: 'center', paddingTop: 8, paddingBottom: 2 },
  handle: { width: 34, height: 3.5, borderRadius: 999, backgroundColor: C.lineSwitch },
});
