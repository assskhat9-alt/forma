/**
 * Мақсаттарға кеткен жалпы уақыт — басты беттегі шаршы карточка.
 *
 * ⚠ Шаршы әрі ӘДЕЙІ ІРІ: бұл — күн сайын өзгеретін көрсеткіш емес,
 * жиналып отыратын еңбек. Соған қараған адам «қанша уақыт сіңірдім»
 * дегенді бір көзбен көреді.
 *
 * ⚠ Бұл уақыт мақсаттың ПАЙЫЗЫНА қатыспайды: пайыз орындалған
 * әрекеттен есептеледі, отырған сағаттан емес (CLAUDE.md §1).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { color as C, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { fmtMinutes, type GoalTime } from '../../lib/report';
import { Card } from '../ui';
import { ChevronRightIcon } from '../icons';

export function TimeCard({
  total,
  goals,
  onPress,
}: {
  total: number;
  goals: GoalTime[];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link">
      <Card style={styles.root}>
        <View style={styles.head}>
          <Text style={styles.label}>{kk.time.totalLabel}</Text>
          <View style={{ flexGrow: 1 }} />
          <ChevronRightIcon size={14} color={C.ink4} strokeWidth={2.4} />
        </View>

        {/* Сан шаршының ортасында тұрады — блоктың мәні сол */}
        <View style={styles.middle}>
          <Text style={styles.value} numberOfLines={2} adjustsFontSizeToFit>
            {total > 0 ? fmtMinutes(total) : '—'}
          </Text>
        </View>

        {goals.length === 0 ? (
          <Text style={styles.empty}>{kk.time.empty}</Text>
        ) : (
          <View style={styles.list}>
            {/* Үшеуі жеткілікті — қалғанын толық есептен көреді */}
            {goals.slice(0, 3).map((g) => (
              <View key={g.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: g.color }]} />
                <Text style={styles.rowName} numberOfLines={1}>
                  {g.title}
                </Text>
                <Text style={styles.rowTime}>{fmtMinutes(g.minutes)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** Шаршы: ені қанша болса, биіктігі де сонша */
  root: { aspectRatio: 1, paddingHorizontal: 18, paddingVertical: 17 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.ink3, flexShrink: 1,
  },
  middle: { flexGrow: 1, justifyContent: 'center' },
  /** Шаршының ортасындағы басты сан — беттегі ең ірі жазу */
  value: {
    fontFamily: font.display, fontSize: 38, lineHeight: 44,
    letterSpacing: -1.6, color: C.ink,
  },
  empty: { fontFamily: font.prose, fontSize: 11.5, lineHeight: 17, color: C.ink4 },

  list: { gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 999, flexShrink: 0 },
  rowName: { fontFamily: font.body, fontSize: 11.5, color: C.inkBody, flexGrow: 1, flexShrink: 1 },
  rowTime: { fontFamily: font.bold, fontSize: 11.5, color: C.ink, flexShrink: 0 },
});
