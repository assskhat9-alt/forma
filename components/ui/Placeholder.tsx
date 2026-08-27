/**
 * 0-фазаның уақытша экраны.
 * Әр экран өз макетінен жазылған сайын осы компонент алынып тасталады.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color as C, font, gutter } from '../../theme/tokens';
import { SectionLabel } from './SectionLabel';

export function Placeholder({ title, mockup }: { title: string; mockup: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <SectionLabel>Әзірге дайын емес</SectionLabel>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.note}>
        <Text style={styles.noteText}>
          Бұл экран <Text style={styles.mono}>design/{mockup}</Text> макетінен жазылады.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: gutter, gap: 8 },
  title: { fontFamily: font.display, fontSize: 26, letterSpacing: -0.9, color: C.ink },
  note: {
    backgroundColor: C.tintSoft,
    borderWidth: 1,
    borderColor: C.tintLine,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  noteText: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, lineHeight: 19 },
  mono: { fontFamily: font.bold, color: C.accentDeep },
});
