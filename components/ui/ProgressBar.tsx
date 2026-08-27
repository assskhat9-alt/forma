/**
 * Прогресс жолағы.
 *
 * Макеттерде биіктігі 4 · 5 · 6 · 7 · 8 · 10 px.
 *
 * `plannedPct` берілсе — «керек еді» маркері (қара тік сызық) салынады.
 * ⚠ Ол мәнді уақыттан есептеуге БОЛМАЙДЫ (CLAUDE.md §5.2) —
 * planned_progress() RPC-тен келуі керек.
 */
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { color as C, radius as R } from '../../theme/tokens';

type Props = {
  /** 0–100 — нақты орындалу */
  pct: number;
  /** 0–100 — жоспар бойынша қай жерде болу керек еді */
  plannedPct?: number;
  height?: number;
  color?: string;
  trackColor?: string;
  markerColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  pct,
  plannedPct,
  height = 5,
  color = C.accent,
  trackColor = C.track,
  markerColor = C.ink,
  style,
}: Props) {
  const clamped = Math.max(0, Math.min(100, pct));
  const hasMarker = plannedPct != null;
  const markerH = height + 8;

  return (
    <View
      style={[
        {
          height,
          borderRadius: R.pill,
          backgroundColor: trackColor,
          // Маркер жолақтан биік — сондықтан кесілмеуі керек
          overflow: hasMarker ? 'visible' : 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          height,
          width: `${clamped}%`,
          borderRadius: R.pill,
          backgroundColor: color,
        }}
      />
      {hasMarker && (
        <View
          style={{
            position: 'absolute',
            left: `${Math.max(0, Math.min(100, plannedPct))}%`,
            top: -(markerH - height) / 2,
            width: 2,
            height: markerH,
            borderRadius: 2,
            backgroundColor: markerColor,
          }}
        />
      )}
    </View>
  );
}
