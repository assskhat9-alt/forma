/**
 * Чекбокс.
 *
 * Макеттерде 15 · 19 · 21 · 22 px, радиусы 5–7.
 * Басу аймағы кемінде 44×44 болуы керек (CLAUDE.md §3) — визуалды
 * өлшемі кіші болса, hitSlop автоматты есептеледі.
 */
import React from 'react';
import { Pressable, View, StyleProp, ViewStyle } from 'react-native';
import { color as C } from '../../theme/tokens';
import { CheckIcon } from '../icons';

const MIN_TOUCH = 44;

type Props = {
  checked: boolean;
  onToggle?: () => void;
  size?: number;
  radius?: number;
  /** Әдет ұяшығы өз түсімен боялады */
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function Checkbox({
  checked,
  onToggle,
  size = 22,
  radius = 7,
  activeColor = C.accent,
  style,
  disabled,
}: Props) {
  const slop = Math.max(0, (MIN_TOUCH - size) / 2);

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled || !onToggle}
      hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? activeColor : C.card,
          borderWidth: 2,
          borderColor: checked ? activeColor : C.lineBox,
        },
        style,
      ]}
    >
      {checked && <CheckIcon size={size * 0.5} color="#FFFFFF" />}
    </Pressable>
  );
}

/**
 * Әдеттің күндік ұяшығы — чекбокс емес, толтырылған тікбұрыш.
 * Орындалмаған, бірақ жоспарланған күнде сұр нүкте тұрады.
 */
export function HabitCell({
  done,
  planned = true,
  future = false,
  onToggle,
  color = C.accent,
  height = 30,
  radius = 11,
}: {
  done: boolean;
  planned?: boolean;
  future?: boolean;
  onToggle?: () => void;
  color?: string;
  height?: number;
  radius?: number;
}) {
  return (
    <Pressable
      onPress={future ? undefined : onToggle}
      disabled={future || !onToggle}
      style={{
        flexGrow: 1,
        height,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: done ? color : future ? C.cardSoft : C.trackHabit,
        borderWidth: 1.5,
        borderColor: done ? color : C.lineField,
        opacity: planned ? 1 : 0.45,
      }}
    >
      {done ? (
        <CheckIcon size={12} color="#FFFFFF" />
      ) : (
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: C.inkOut }} />
      )}
    </Pressable>
  );
}
