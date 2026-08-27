/**
 * Чиптер мен белгілер.
 *
 * Макеттерде үш нұсқа кездеседі:
 *   tint    — күлгін фон, мақсат атауы («Ағылшын C1»)
 *   flat    — сұр фон, бейтарап мәлімет
 *   dark    — қара фон, ең өткір күй
 */
import React from 'react';
import { Pressable, Text, View, StyleProp, ViewStyle } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';

export type ChipTone = 'tint' | 'flat' | 'dark' | 'outline';

const TONES: Record<ChipTone, { bg: string; fg: string; border: string }> = {
  tint: { bg: C.tint, fg: C.accentDeep, border: 'transparent' },
  flat: { bg: C.trackChip, fg: C.inkMuted, border: 'transparent' },
  dark: { bg: C.ink, fg: '#FFFFFF', border: C.ink },
  outline: { bg: C.card, fg: C.ink2, border: C.lineField },
};

type Props = {
  label: string;
  tone?: ChipTone;
  active?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, tone = 'tint', active, onPress, size = 'md', style }: Props) {
  const t = active ? TONES.dark : TONES[tone];
  const pad = size === 'sm' ? { paddingVertical: 2, paddingHorizontal: 7 } : { paddingVertical: 5, paddingHorizontal: 11 };
  const fs = size === 'sm' ? 9.5 : 11.5;

  const body = (
    <View
      style={[
        {
          borderRadius: R.pill,
          backgroundColor: t.bg,
          borderWidth: 1.5,
          borderColor: t.border,
          alignSelf: 'flex-start',
        },
        pad,
        style,
      ]}
    >
      <Text style={{ fontFamily: font.bold, fontSize: fs, color: t.fg, letterSpacing: fs * 0.05 }}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

/**
 * Қарқын белгісі — «+10%» / «−7%» / «−38%».
 *
 * Түс ережесі макеттен (Zhyl.dc.html, Taimlain.dc.html):
 *   gap > 0    → күлгін тінт (алда)
 *   gap ≤ −20  → ҚАРА (өткір артта қалу)
 *   әйтпесе    → бейтарап сұр
 */
export function PaceBadge({ gap, style }: { gap: number; style?: StyleProp<ViewStyle> }) {
  const ahead = gap > 0;
  const critical = gap <= -20;

  const bg = ahead ? C.tint : critical ? C.ink : C.trackChip;
  const fg = ahead ? C.accentDeep : critical ? '#FFFFFF' : C.inkMuted;

  // Теріс сан U+2212 (минус) арқылы жазылады, дефис емес
  const sign = gap > 0 ? '+' : gap < 0 ? '−' : '';
  const label = `${sign}${Math.abs(gap)}%`;

  return (
    <View
      style={[
        { borderRadius: R.pill, backgroundColor: bg, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
        style,
      ]}
    >
      <Text style={{ fontFamily: font.bold, fontSize: 10, color: fg }}>{label}</Text>
    </View>
  );
}
