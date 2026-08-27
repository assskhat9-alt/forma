/**
 * Прогресс сақинасы.
 *
 * Макеттерде 34 · 38 · 44 · 64 · 76 · 84 · 100 · 260 px өлшемдері кездеседі.
 * Сақина әрқашан −90° бұрылған (12 сағаттан басталады) және ұшы дөңгелек.
 *
 * ⚠ Бүгінгі сақина ТЕК тапсырмалардан есептеледі. Әдеттер бұл санға
 * ешқашан қосылмайды (CLAUDE.md §7.2).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { color as C, font } from '../../theme/tokens';

type Props = {
  /** 0–100 */
  pct: number;
  size: number;
  strokeWidth: number;
  color?: string;
  trackColor?: string;
  /** Сақина ішіндегі мазмұн. Берілмесе — пайыз саны шығады. */
  children?: React.ReactNode;
  /** Сан астындағы кіші белгі, мыс. «КҮН» */
  label?: string;
  /** Сан өлшемі — берілмесе size-тан есептеледі */
  numberSize?: number;
  showPercentSign?: boolean;
};

export function ProgressRing({
  pct,
  size,
  strokeWidth,
  color = C.accent,
  trackColor = C.tint,
  children,
  label,
  numberSize,
  showPercentSign = true,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circumference * (1 - clamped / 100);
  const fs = numberSize ?? Math.round(size * 0.22);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={trackColor} strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        {children ?? (
          <>
            <Text style={[styles.number, { fontSize: fs, letterSpacing: -fs * 0.03 }]}>
              {Math.round(clamped)}{showPercentSign ? '%' : ''}
            </Text>
            {label ? <Text style={styles.label}>{label}</Text> : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: font.display,
    color: C.ink,
    lineHeight: undefined,
  },
  label: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1.02,
    color: C.ink3,
    marginTop: 3,
  },
});
