/**
 * Ашылған жазба — ТЕЛЕФОНҒА арналған бөлек бет.
 *
 * ⚠ Кең экранда бұл бет ашылмайды: онда тізім мен жазба `/notes`-та
 * қатар тұрады. Мұнда тек тар экранда келеміз.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { color as C, font, gutter, centered } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { goBack } from '../../lib/nav';
import { errorText } from '../../lib/errors';
import { useBreakpoint } from '../../lib/breakpoints';
import { useNotes } from '../../lib/notes';
import { NoteEditor } from '../../components/notes/NoteEditor';
import { ChevronLeftIcon } from '../../components/icons';
import { KeyboardFrame } from '../../components/layout/KeyboardFrame';

export default function NoteScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: notes, isLoading, isError, error } = useNotes();
  const note = (notes ?? []).find((n) => n.id === id) ?? null;

  return (
    <KeyboardFrame>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 14 },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => goBack('/notes')}
            hitSlop={10}
            accessibilityRole="button"
          >
            <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>{kk.notes.title}</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.body}>
          {isError ? (
            <Text style={styles.error}>{errorText(error)}</Text>
          ) : isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : note ? (
            <NoteEditor
              note={note}
              wide={wide}
              // Өшірілген жазбаның беті тұрып қалмауы керек
              onDeleted={() => router.replace('/notes' as never)}
            />
          ) : (
            <View style={styles.center}>
              <Text style={styles.gone}>{kk.notes.gone}</Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: font.display, fontSize: 12, letterSpacing: 1.8, color: C.ink,
  },
  body: { ...centered, flex: 1, width: '100%', paddingHorizontal: gutter },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gone: { fontFamily: font.body, fontSize: 13, color: C.ink3 },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, marginTop: 12 },
});
