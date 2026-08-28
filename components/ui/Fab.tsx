/**
 * Қалқыма қосу түймесі.
 *
 * ⚠ Неге жоғарғы бұрышта емес: телефонда экранның жоғарғы оң жағы —
 * саусақ ең қиын жететін жер, ал қосу — ең жиі істелетін әрекет.
 * Сондықтан ол төменгі оң жақта, тізбенің үстінде тұрады.
 *
 * Жазуы бар: жалаң «+» не қосатыны белгісіз, әсіресе экранда бірнеше
 * тізім болса.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font } from '../../theme/tokens';
import { PlusIcon, CloseIcon } from '../icons';

export function Fab({
  label,
  onPress,
  /** Ашық бланканы жабатын күйге ауысады */
  active = false,
  /** Төменгі жолақ бар экранда оның үстінен қалқуы үшін */
  offset = 0,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  offset?: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { bottom: insets.bottom + 18 + offset }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        style={[styles.btn, active && styles.btnOn]}
        accessibilityRole="button"
        accessibilityState={{ expanded: active }}
      >
        {active ? (
          <CloseIcon size={13} color={C.accentDeep} />
        ) : (
          <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.8} />
        )}
        <Text style={[styles.text, active && { color: C.accentDeep }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 18,
    left: 18,
    alignItems: 'flex-end',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: R.pill,
    backgroundColor: C.accent,
    // Тізімнің үстінде қалқып тұрғаны көрінуі керек
    shadowColor: C.accent,
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  btnOn: {
    backgroundColor: C.card,
    shadowColor: '#14142D',
    shadowOpacity: 0.14,
  },
  text: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },
});
