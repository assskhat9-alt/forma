/**
 * Dropify стиліндегі жылдамдық / қарқын сақинасы (Speed Statistic).
 * Дөңгелек нүктелі спидометр + ортасындағы үлкен сан + легенда.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { color as C, font } from '../../theme/tokens';
import { Card } from '../ui';

export function RingCard({
  title = 'Күндік қарқын',
  caption = 'қарқын',
  pct,
  unit = '%',
  onPress,
}: {
  title?: string;
  caption?: string;
  pct: number;
  unit?: string;
  color?: string;
  onPress?: () => void;
}) {
  const safePct = Math.min(100, Math.max(0, pct));
  const totalTicks = 26;
  const activeTicks = Math.round((safePct / 100) * totalTicks);

  // Спидометр шеңбері бойынша 26 нүкте (140°-тан 400°-қа дейін = 260° доға)
  const r = 54;
  const cx = 70;
  const cy = 70;
  const startAngle = 140;
  const totalArc = 260;

  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const angle = startAngle + (i / (totalTicks - 1)) * totalArc;
    const rad = (angle * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    const isActive = i < activeTicks;
    return { x, y, isActive };
  });

  const body = (
    <Card radius={22} style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {/* ── Легенда ── */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#1A1D26' }]} />
          <Text style={styles.legendText}>Орташа</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: C.accent }]} />
          <Text style={styles.legendText}>Қазіргі</Text>
        </View>
      </View>

      {/* ── Спидометр диаграммасы ── */}
      <View style={styles.gaugeContainer}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          {ticks.map((t, idx) => (
            <Circle
              key={idx}
              cx={t.x}
              cy={t.y}
              r={t.isActive ? 3.5 : 2.5}
              fill={t.isActive ? (idx > 18 ? '#AA9EF7' : C.accent) : '#E2E8F0'}
            />
          ))}
        </Svg>

        <View style={styles.centerContent}>
          <Text style={styles.centerNumber}>
            {safePct}
            <Text style={styles.unitText}>{unit}</Text>
          </Text>
          <Text style={styles.captionText}>{caption}</Text>
        </View>
      </View>
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
  card: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
  },
  title: {
    fontFamily: font.title,
    fontSize: 14,
    color: C.ink,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: font.body,
    fontSize: 11,
    color: C.ink3,
  },

  gaugeContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    fontFamily: font.display,
    fontSize: 28,
    letterSpacing: -0.8,
    color: C.ink,
  },
  unitText: {
    fontFamily: font.title,
    fontSize: 15,
    color: C.accent,
  },
  captionText: {
    fontFamily: font.body,
    fontSize: 10.5,
    color: C.ink3,
    marginTop: 2,
  },
});
