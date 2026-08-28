/**
 * Қосу түймесі — тізімнің АСТЫНДА тұрады.
 *
 * ⚠ Экранның бұрышында да, қалқып та тұрмайды. Қосу — тізімнің
 * жалғасы: соңғы жолды оқып болған жерде түйме кездеседі, сол жерден
 * жаңасы қосылады. Қалқыма түйме мазмұнды жауып тұрады да, көз оны
 * тізіммен байланыстырмайды.
 *
 * Жазуы бар: жалаң «+» не қосатынын айтпайды.
 */
import React from 'react';
import { Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { PlusIcon, CloseIcon } from '../icons';

export function AddButton({
  label,
  onPress,
  /** Бланка ашық — түйме жабуға айналады */
  active = false,
  style,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, active && styles.btnOn, style]}
      accessibilityRole="button"
      accessibilityState={{ expanded: active }}
    >
      {active ? (
        <CloseIcon size={12} color={C.accentDeep} />
      ) : (
        <PlusIcon size={15} color={C.accentDeep} strokeWidth={2.8} />
      )}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: R.sm,
    backgroundColor: C.tintSoft,
    borderWidth: 1.5,
    borderColor: C.tintLine,
  },
  btnOn: { backgroundColor: C.card, borderColor: C.line },
  text: { fontFamily: font.bold, fontSize: 13, color: C.accentDeep },
});
