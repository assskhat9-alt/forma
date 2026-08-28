/**
 * Сақиналы қорытынды карточка — панельдің оң бағанында.
 *
 * Бір сан, оның аты және қасында сақина. Астындағы `caption` неден
 * шыққанын айтады: пайыз қайдан келгені түсініксіз болса, оған сенбейді.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { color as C, font } from '../../theme/tokens';
import { Card, ProgressRing } from '../ui';

export function RingCard({
  title,
  caption,
  pct,
  color = C.accent,
  onPress,
}: {
  title: string;
  caption: string;
  pct: number;
  color?: string;
  onPress?: () => void;
}) {
  const body = (
    <Card style={styles.root}>
      <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>
      </View>

      <ProgressRing
        pct={pct}
        size={64}
        strokeWidth={7}
        color={color}
        numberSize={15}
      />
    </Card>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="link">
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 17,
    paddingVertical: 16,
  },
  title: { fontFamily: font.bold, fontSize: 14.5, letterSpacing: -0.29, color: C.ink },
  caption: { fontFamily: font.prose, fontSize: 11.5, lineHeight: 17, color: C.inkMuted, marginTop: 5 },
});
