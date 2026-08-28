/**
 * Панельдің жоғарғы қатарындағы бір сан.
 *
 * Бір карточка — бір өлшем. Біріншісі ғана қара (`hero`): панельде
 * басты сан біреу болуы керек, әйтпесе көз қайда тоқтарын білмейді.
 *
 * ⚠ «Өткен аптадан +4%» деген өсім МҮЛДЕ жоқ. Ондай сан үшін тарихи
 * дерек керек, ал ол әлі жиналмаған: болжаған саннан ештеңе жазбаған
 * артық. Оның орнына `note` — шынайы құрам («4 / 6 орындалды»).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { Card, DarkCard } from '../ui';

export type Stat = {
  /** Не өлшенеді — жоғарғы кіші жазу */
  label: string;
  /** Санның өзі, форматталған күйде: «67%», «4 / 6», «3» */
  value: string;
  /** Санның астындағы түсіндірме — нақты дерек, болжам емес */
  note?: string;
  /** Басылса қайда апарады; болмаса карточка жай көрініс */
  href?: string;
};

export function StatCard({
  stat,
  hero = false,
  onPress,
}: {
  stat: Stat;
  hero?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Text style={[styles.label, hero && { color: C.darkInk2 }]} numberOfLines={1}>
        {stat.label}
      </Text>
      <Text style={[styles.value, hero && { color: '#FFFFFF' }]} numberOfLines={1}>
        {stat.value}
      </Text>
      {stat.note ? (
        <Text style={[styles.note, hero && { color: C.darkInk3 }]} numberOfLines={1}>
          {stat.note}
        </Text>
      ) : null}
    </>
  );

  const inner = hero ? (
    <DarkCard radius={R.cardSm} style={styles.pad}>
      {body}
    </DarkCard>
  ) : (
    <Card level="cardSm" radius={R.cardSm} style={styles.pad}>
      {body}
    </Card>
  );

  if (!onPress) return <View style={styles.cell}>{inner}</View>;

  return (
    <Pressable style={styles.cell} onPress={onPress} accessibilityRole="link">
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** Қатардағы төрт карточка бірдей енді бөліседі, бірақ қысылмайды */
  cell: { flexGrow: 1, flexShrink: 1, flexBasis: 150, minWidth: 130 },
  pad: { paddingHorizontal: 16, paddingVertical: 15 },

  label: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: C.inkMuted,
  },
  value: {
    fontFamily: font.display,
    fontSize: 26,
    letterSpacing: -0.7,
    color: C.ink,
    marginTop: 8,
  },
  note: {
    fontFamily: font.body,
    fontSize: 11,
    color: C.ink4,
    marginTop: 6,
  },
});
