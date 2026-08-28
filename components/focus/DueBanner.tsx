/**
 * «Уақыты келді» — ҰСЫНЫС.
 *
 * ⚠ Таймер ӨЗІ ҚОСЫЛМАЙДЫ. Әрекеттің белгіленген уақыты жеткенде тек
 * осы жолақ шығады, ал қосу-қоспауды адам шешеді. «Кейін» дегенде
 * жолақ жабылады да, сол әрекет үшін қайта мазаламайды.
 *
 * Уақыты қойылмаған әрекет мұнда ешқашан шықпайды: уақытсыз әрекет —
 * күн бойы істелетін нәрсе, оны сағатпен еске салудың мәні жоқ.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { useDismissStore } from '../../lib/focus';
import { ClockIcon, PlayIcon } from '../icons';
import type { Goal } from '../../lib/database.types';

export function DueBanner({ action }: { action: Goal }) {
  const dismiss = useDismissStore((s) => s.dismiss);

  const at = action.scheduled_at ? new Date(action.scheduled_at) : null;
  const time = at
    ? `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
    : '';

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.clock}>
          <ClockIcon size={14} color={C.accentOnDark} strokeWidth={2.6} />
        </View>

        <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
          <Text style={styles.label}>
            {kk.focus.dueTitle}
            {time ? ` · ${time}` : ''}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {action.title}
          </Text>
        </View>
      </View>

      <Text style={styles.ask}>{kk.focus.dueAsk}</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => dismiss(action.id)}
          style={styles.later}
          accessibilityRole="button"
        >
          <Text style={styles.laterText}>{kk.focus.dueLater}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            dismiss(action.id);
            router.push(`/focus?taskId=${action.id}` as never);
          }}
          style={styles.start}
          accessibilityRole="button"
        >
          <PlayIcon size={13} color="#FFFFFF" />
          <Text style={styles.startText}>{kk.focus.dueStart}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: C.darkBg,
    borderRadius: R.cardXs,
    paddingHorizontal: 16,
    paddingVertical: 15,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clock: {
    width: 34, height: 34, borderRadius: R.pill, flexShrink: 0,
    backgroundColor: 'rgba(122,108,240,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.accent2,
  },
  title: {
    fontFamily: font.bold, fontSize: 14, letterSpacing: -0.28,
    color: '#FFFFFF', marginTop: 3,
  },
  ask: { fontFamily: font.body, fontSize: 12, color: C.darkInk2, marginTop: 11 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  later: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: R.sm,
    backgroundColor: C.darkCard, borderWidth: 1, borderColor: C.darkLine,
  },
  laterText: { fontFamily: font.bold, fontSize: 12, color: C.darkInk2 },
  start: {
    flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 10, borderRadius: R.sm, backgroundColor: C.accent,
  },
  startText: { fontFamily: font.bold, fontSize: 12.5, color: '#FFFFFF' },
});
