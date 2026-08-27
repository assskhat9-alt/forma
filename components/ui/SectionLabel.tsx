/**
 * Бөлім тақырыбы — макеттердегі `.lbl` класы.
 * 10px / weight 800 / letterSpacing .13em / uppercase / ink3
 */
import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { color as C, font } from '../../theme/tokens';

export function SectionLabel({
  children,
  color = C.ink3,
  style,
}: {
  children: string;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: font.bold,
          fontSize: 10,
          letterSpacing: 1.3,
          textTransform: 'uppercase',
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
