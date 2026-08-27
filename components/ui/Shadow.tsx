/**
 * Екі қабатты көлеңке.
 *
 * Макеттерде көлеңке әрқашан екі қабат:
 *   box-shadow: 0 1px 2px rgba(20,20,45,.04), 0 10px 28px rgba(20,20,45,.05)
 *
 * RN iOS бір View-ға бір ғана көлеңке салады. Сондықтан екі View-ды
 * қабаттастырамыз: сыртқысы — жұмсақ әрі кең, ішкісі — тығыз әрі жақын.
 * Android-та көлеңке elevation-мен салынады, ол екі қабатты қолдамайды —
 * тек сыртқы қабаттың elevation мәні жұмыс істейді.
 *
 * ⚠ Көлеңке көрінуі үшін View-дың фоны мөлдір болмауы КЕРЕК.
 */
import React from 'react';
import { View, Platform, StyleProp, ViewStyle } from 'react-native';
import { shadow, color as C } from '../../theme/tokens';

type Layered = { outer: object; inner: object };

type Props = {
  /** Қай көлеңке нұсқасы — tokens.shadow ішінен */
  level?: 'card' | 'cardSm' | 'widget';
  radius: number;
  /** Көлеңке салынатын фон. Мөлдір болса көлеңке көрінбейді. */
  background?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function Shadow({
  level = 'card',
  radius,
  background = C.card,
  style,
  children,
}: Props) {
  const s = shadow[level] as Layered;

  // Android: elevation екі рет қосылса көлеңке қоюланып кетеді.
  // Сондықтан ішкі қабатты тек iOS-та саламыз.
  if (Platform.OS === 'android') {
    return (
      <View style={[s.outer, { borderRadius: radius, backgroundColor: background }, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[s.outer, { borderRadius: radius, backgroundColor: background }]}>
      <View style={[s.inner, { borderRadius: radius, backgroundColor: background }, style]}>
        {children}
      </View>
    </View>
  );
}
