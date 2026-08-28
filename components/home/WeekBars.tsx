/**
 * Апта серпіні — күндік бағаналар.
 *
 * Әр бағана бір күн. Толық биіктік — сол күнге қойылған әрекеттің
 * САНЫ, ішіндегі қою бөлік — орындалғаны. Яғни биіктік «қанша жоспар
 * болды», толтыру «қаншасы бітті» дегенді бөлек көрсетеді: аз істеген
 * күн мен аз жоспарлаған күн бірдей көрінбеуі керек.
 *
 * ⚠ Бос күн де тұрады. Тізімнен түсіп қалса, апта суреті өтірік болады.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { Card, SectionLabel } from '../ui';
import { ChevronRightIcon } from '../icons';

export type DayBar = {
  date: Date;
  /** Қысқа әріп — Дү, Се, Сә… */
  short: string;
  total: number;
  done: number;
  today: boolean;
};

const TRACK_H = 132;

export function WeekBars({
  title,
  days,
  onPickDay,
  onOpen,
}: {
  title: string;
  days: DayBar[];
  onPickDay?: (d: Date) => void;
  /** Берілсе — тақырыпта апта қорытындысына сілтеме шығады */
  onOpen?: () => void;
}) {
  const peak = Math.max(1, ...days.map((d) => d.total));

  return (
    <Card style={styles.root}>
      <View style={styles.head}>
        <SectionLabel>{title}</SectionLabel>
        <View style={{ flexGrow: 1 }} />
        {onOpen && (
          <Pressable onPress={onOpen} hitSlop={8} accessibilityRole="link">
            <ChevronRightIcon size={13} color={C.accent} strokeWidth={2.6} />
          </Pressable>
        )}
      </View>

      <View style={styles.row}>
        {days.map((d) => {
          const h = Math.round((d.total / peak) * TRACK_H);
          const fill = d.total ? Math.round((d.done / d.total) * h) : 0;

          return (
            <Pressable
              key={d.date.toISOString()}
              style={styles.col}
              onPress={onPickDay ? () => onPickDay(d.date) : undefined}
              accessibilityRole={onPickDay ? 'button' : undefined}
              accessibilityLabel={`${d.short}: ${d.done} / ${d.total}`}
            >
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(h, d.total ? 6 : 3) },
                    // Жоспар жоқ күн — тек жіңішке із, бағана емес
                    !d.total && { backgroundColor: C.lineSoft },
                  ]}
                >
                  <View style={[styles.fill, { height: fill }]} />
                </View>
              </View>

              <Text style={[styles.day, d.today && styles.dayOn]}>{d.short}</Text>
              <Text style={[styles.num, d.today && { color: C.accentDeep }]}>
                {d.total ? `${d.done}/${d.total}` : '—'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { padding: 17, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 14,
  },
  col: { flexGrow: 1, flexShrink: 1, alignItems: 'center', gap: 7 },

  track: { height: TRACK_H, justifyContent: 'flex-end', width: '100%' },
  bar: {
    width: '100%',
    maxWidth: 44,
    alignSelf: 'center',
    borderRadius: R.boxSm,
    backgroundColor: C.tintBar,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { width: '100%', backgroundColor: C.accent },

  day: { fontFamily: font.body, fontSize: 11, color: C.inkMuted },
  dayOn: { fontFamily: font.bold, color: C.ink },
  num: { fontFamily: font.bold, fontSize: 10, color: C.ink4 },
});
