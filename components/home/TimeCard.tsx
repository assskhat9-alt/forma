/**
 * Мақсаттарға кеткен жалпы уақыт — басты беттегі кең карточка.
 *
 * ⚠ Сандар қатарындағы карточкалардан ӘДЕЙІ ІРІ: бұл — күн сайын
 * өзгермейтін, жиналып отыратын сан. Соған қараған адам «қанша еңбек
 * сіңірдім» дегенді бір көзбен көреді.
 *
 * ⚠ Бұл уақыт мақсаттың ПАЙЫЗЫНА қатыспайды: пайыз орындалған
 * әрекеттен есептеледі, отырған сағаттан емес (CLAUDE.md §1).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
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

        <Text style={styles.value}>{total > 0 ? fmtMinutes(total) : '—'}</Text>

        {goals.length === 0 ? (
          <Text style={styles.empty}>{kk.time.empty}</Text>
        ) : (
          <View style={styles.chips}>
            {/* Үшеуі жеткілікті — қалғанын толық есептен көреді */}
            {goals.slice(0, 3).map((g) => (
              <View key={g.id} style={styles.chip}>
                <View style={[styles.dot, { backgroundColor: g.color }]} />
                <Text style={styles.chipName} numberOfLines={1}>
                  {g.title}
                </Text>
                <Text style={styles.chipTime}>{fmtMinutes(g.minutes)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 18, paddingVertical: 17 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.ink3, flexShrink: 1,
  },
  /** Сандар қатарындағы 26px-тен ірі — бұл беттегі ең үлкен сан емес,
   *  бірақ өз блогында басым тұруы керек */
  value: {
    fontFamily: font.display, fontSize: 34, letterSpacing: -1.4,
    color: C.ink, marginTop: 10,
  },
  empty: { fontFamily: font.prose, fontSize: 11.5, color: C.ink4, marginTop: 10 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.cardSoft, borderRadius: R.pill,
    paddingHorizontal: 11, paddingVertical: 7,
    maxWidth: '100%',
  },
  dot: { width: 6, height: 6, borderRadius: 999, flexShrink: 0 },
  chipName: { fontFamily: font.body, fontSize: 11.5, color: C.inkBody, flexShrink: 1 },
  chipTime: { fontFamily: font.bold, fontSize: 11.5, color: C.ink, flexShrink: 0 },
});
