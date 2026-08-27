/**
 * Ауыстырғыш (switch).
 * Макетте екі өлшем: 46×27 (Мотивация) және 44×26 (Виджет).
 */
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { color as C, radius as R } from '../../theme/tokens';

type Props = {
  value: boolean;
  onChange?: (next: boolean) => void;
  width?: number;
  height?: number;
};

export function Toggle({ value, onChange, width = 46, height = 27 }: Props) {
  const t = useSharedValue(value ? 1 : 0);
  const pad = 3;
  const knob = height - pad * 2;
  const travel = width - pad * 2 - knob;

  useEffect(() => {
    t.value = withTiming(value ? 1 : 0, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [value, t]);

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [C.lineSwitch, C.accent]),
  }));

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * travel }],
  }));

  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      disabled={!onChange}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View
        style={[
          { width, height, borderRadius: R.pill, padding: pad, justifyContent: 'center' },
          track,
        ]}
      >
        <Animated.View
          style={[
            {
              width: knob,
              height: knob,
              borderRadius: R.pill,
              backgroundColor: '#FFFFFF',
              shadowColor: '#14142D',
              shadowOpacity: 0.22,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            },
            thumb,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
