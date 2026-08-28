/**
 * Панельдегі шағын апта жолағы.
 *
 * Толық күнтізбе емес — тек ағымдағы апта. Күнді басқанда панельдің
 * төменгі кестесі сол күнге ауысады, толық торды көру үшін «Күнтізбе»
 * бөлімі бар.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { Card } from '../ui';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { isSameDay } from 'date-fns';

export type StripDay = { date: Date; short: string };

export function WeekStrip({
  title,
  days,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  title: string;
  days: StripDay[];
  selected: Date;
  onSelect: (d: Date) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <Card style={styles.root}>
      <View style={styles.head}>
        <Pressable onPress={onPrev} style={styles.arrow} accessibilityRole="button">
          <ChevronLeftIcon size={13} color={C.ink3} strokeWidth={2.4} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <Pressable onPress={onNext} style={styles.arrow} accessibilityRole="button">
          <ChevronRightIcon size={13} color={C.ink3} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {days.map((d) => {
          const on = isSameDay(d.date, selected);

          return (
            <Pressable
              key={d.date.toISOString()}
              onPress={() => onSelect(d.date)}
              style={[styles.cell, on && styles.cellOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.short, on && styles.shortOn]}>{d.short}</Text>
              <Text style={[styles.num, on && styles.numOn]}>{d.date.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { padding: 15 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    flexGrow: 1,
    textAlign: 'center',
    fontFamily: font.bold,
    fontSize: 13.5,
    color: C.ink,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: R.boxSm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: { flexDirection: 'row', gap: 4, marginTop: 12 },
  cell: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: R.sm,
  },
  cellOn: { backgroundColor: C.tintRow },
  short: { fontFamily: font.body, fontSize: 10.5, color: C.inkMuted },
  shortOn: { fontFamily: font.bold, color: C.accentDeep },
  num: { fontFamily: font.bold, fontSize: 14, color: C.ink },
  numOn: { color: C.accentDeep },
});
