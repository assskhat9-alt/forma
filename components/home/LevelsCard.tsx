/**
 * Каскад деңгейлері — ай мен жылдың бүгінгі пайызы.
 *
 * ⚠ Пайыз ЕСЕПТЕЛЕДІ, жоспарланбайды: әр деңгейдің саны — сол тармақтағы
 * орындалған әрекеттердің үлесі. Жүйе бұл сандарды өзі қоймайды.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { color as C, font } from '../../theme/tokens';
import { Card, SectionLabel, ProgressBar } from '../ui';

export type Level = {
  id: string;
  title: string;
  pct: number;
  color: string;
};

export function LevelsCard({
  title,
  levels,
  emptyText,
}: {
  title: string;
  levels: Level[];
  emptyText: string;
}) {
  return (
    <Card style={styles.root}>
      <SectionLabel>{title}</SectionLabel>

      {levels.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <View style={styles.list}>
          {levels.map((lv) => (
            <View key={lv.id} style={{ gap: 5 }}>
              <View style={styles.head}>
                <View style={styles.name}>
                  <View style={[styles.dot, { backgroundColor: lv.color }]} />
                  <Text style={styles.text} numberOfLines={1}>
                    {lv.title}
                  </Text>
                </View>
                <Text style={styles.pct}>{lv.pct}%</Text>
              </View>
              <ProgressBar pct={lv.pct} color={lv.color} height={4} />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16 },
  empty: { fontFamily: font.prose, fontSize: 11.5, lineHeight: 17, color: C.ink4, marginTop: 10 },
  list: { gap: 11, marginTop: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 999, flexShrink: 0 },
  text: { fontFamily: font.body, fontSize: 11.5, color: C.inkBody, flexShrink: 1 },
  pct: { fontFamily: font.bold, fontSize: 11.5, color: C.ink },
});
