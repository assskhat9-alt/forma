/**
 * Период ауыстырғышы — КҮН / АПТА / АЙ / ЖЫЛ.
 *
 * CLAUDE.md §7.3: оң жақтағы чипті басқанда сегмент `maxWidth: 250 → 0`
 * анимациясымен тұтасымен ішке тартылады. Ені экранға қарай өзгереді:
 * телефон 250–260, планшет 300.
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { color as C, radius as R, font } from '../../theme/tokens';
import { ChevronUpIcon } from '../icons';

type Props = {
  items: readonly string[];
  index: number;
  onChange: (i: number) => void;
  /** Жиналған-жиналмағаны — сыртта басқарылады */
  open: boolean;
  onToggleOpen: () => void;
  /** Ашық күйдегі ең үлкен ені: телефон 250–260, планшет 300 */
  maxWidth?: number;
};

export function CollapsibleSegments({
  items,
  index,
  onChange,
  open,
  onToggleOpen,
  maxWidth = 250,
}: Props) {
  const t = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    t.value = withTiming(open ? 1 : 0, {
      duration: 280,
      easing: Easing.inOut(Easing.ease),
    });
  }, [open, t]);

  const wrap = useAnimatedStyle(() => ({
    maxWidth: t.value * maxWidth,
    opacity: t.value,
  }));

  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(1 - t.value) * 180}deg` }],
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.clip, wrap]}>
        <View style={styles.track}>
          {items.map((n, i) => {
            const on = i === index;
            return (
              <Pressable
                key={n}
                onPress={() => onChange(i)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.seg, on && styles.segOn]}
              >
                <Text style={[styles.segText, { color: on ? C.ink : C.inkSeg }]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <Pressable onPress={onToggleOpen} style={styles.chip} accessibilityRole="button">
        <Text style={styles.chipText}>{items[index]}</Text>
        <Animated.View style={chevron}>
          <ChevronUpIcon size={12} color={C.ink3} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clip: { flexGrow: 1, flexShrink: 1, overflow: 'hidden' },
  track: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: C.trackSeg,
    borderRadius: R.chipSm,
    padding: 3,
  },
  seg: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: R.boxSm,
  },
  segOn: {
    backgroundColor: C.card,
    shadowColor: '#14142D',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { fontFamily: font.bold, fontSize: 11.5, letterSpacing: 0.46 },
  chip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: R.sm,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.lineField,
  },
  chipText: { fontFamily: font.bold, fontSize: 11.5, color: C.accentDeep },
});

/** Жиналмайтын қарапайым нұсқа — Уақыт есебіндегі Күн/7 күн/Ай */
export function Segments({
  items,
  index,
  onChange,
}: {
  items: readonly string[];
  index: number;
  onChange: (i: number) => void;
}) {
  return (
    <View style={styles.track}>
      {items.map((n, i) => {
        const on = i === index;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.seg, { paddingVertical: 9 }, on && styles.segOn]}
          >
            <Text style={[styles.segText, { color: on ? C.ink : C.inkSeg }]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
