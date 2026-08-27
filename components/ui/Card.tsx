/**
 * Карточкалар.
 *
 * Forma-да карточканың ТҮСІ мағына білдіреді (CLAUDE.md §3):
 *   Card      (ақ)        — мақсат және пайыз
 *   DarkCard  (қара)      — мақсат ЕМЕС нәрсе: мотивация, серия, фокус
 *   DashedCard (үзік жиек) — әдеттер блогы, пайызға кірмейді
 * Бұл жүйені бұзбаңыз.
 */
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { color as C, radius as R } from '../../theme/tokens';
import { Shadow } from './Shadow';

type CardProps = {
  /** Тізім ішіндегі кіші карточка жұмсағырақ көлеңке алады */
  level?: 'card' | 'cardSm' | 'widget';
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function Card({ level = 'card', radius = R.card, style, children }: CardProps) {
  return (
    <Shadow level={level} radius={radius} background={C.card} style={style}>
      {children}
    </Shadow>
  );
}

type DarkCardProps = {
  radius?: number;
  /** Фокус экраны darkBg0-ды, қалғаны darkBg-ды алады */
  background?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function DarkCard({
  radius = R.cardLg,
  background = C.darkBg,
  style,
  children,
}: DarkCardProps) {
  return (
    <View style={[{ borderRadius: radius, backgroundColor: background, overflow: 'hidden' }, style]}>
      {children}
    </View>
  );
}

/**
 * Үзік сызықты жиек = әдеттер блогы.
 * Бұл визуалды белгі «мұнда есептелетін ештеңе жоқ» дегенді білдіреді.
 */
export function DashedCard({
  radius = R.cardSm,
  style,
  children,
}: { radius?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <View style={[styles.dashed, { borderRadius: radius }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  dashed: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.lineDash,
  },
});
