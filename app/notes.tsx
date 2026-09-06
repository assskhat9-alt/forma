/**
 * МЕНІҢ ОЙЛАРЫМ.
 *
 * ⚠ Мұнда пайыз да, мерзім де, «орындалды» да жоқ. Ой — есеп берілетін
 * нәрсе емес. Сондықтан бұл экран каскадқа мүлде қатыспайды.
 *
 * ⚠ Екі түрлі көрініс, себебі экрандар да екі түрлі:
 *   · телефонда — тізім, жазбаны басқанда ол БӨЛЕК бетте ашылады
 *     (`/notes/[id]`). Тар экранда тізім мен мәтін қатар тұра алмайды;
 *   · планшет пен компьютерде — сол жақта тізім, оң жақта жазба, екеуі
 *     бір бетте. Кең орын бос тұрмауы керек.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { color as C, font, gutter, centered } from '../theme/tokens';
import { kk } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useBreakpoint } from '../lib/breakpoints';
import { useNotes, useCreateNote } from '../lib/notes';
import { NoteList } from '../components/notes/NoteList';
import { NoteEditor } from '../components/notes/NoteEditor';
import { ChevronLeftIcon } from '../components/icons';
import { KeyboardFrame } from '../components/layout/KeyboardFrame';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';

  const { data: notes, isLoading, isError, error } = useNotes();
  const create = useCreateNote();
  const list = notes ?? [];

  const [openId, setOpenId] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  // Кең экранда оң жақ бос тұрмауы үшін бірінші жазба өзі ашылады
  useEffect(() => {
    if (!wide) return;
    if (openId && list.some((n) => n.id === openId)) return;
    setOpenId(list[0]?.id ?? null);
  }, [wide, list, openId]);

  const open = list.find((n) => n.id === openId) ?? null;

  const addNote = () => {
    setFailed(null);
    create.mutate(
      { title: '', body: '' },
      {
        onSuccess: (id) => {
          if (wide) setOpenId(id);
          else router.push(`/notes/${id}` as never);
        },
        onError: (e) => setFailed(errorText(e)),
      },
    );
  };

  const openNote = (id: string) => {
    if (wide) setOpenId(id);
    else router.push(`/notes/${id}` as never);
  };

  return (
    <KeyboardFrame>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + (wide ? 18 : 12), paddingBottom: insets.bottom + 14 },
        ]}
      >
        <View style={[styles.header, wide ? styles.headWide : styles.headPhone]}>
          <Pressable onPress={() => goBack('/')} hitSlop={10} accessibilityRole="button">
            <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>{kk.notes.title}</Text>
          <View style={{ width: 20 }} />
        </View>

        {isError ? (
          <View style={styles.center}>
            <Text style={styles.error}>{errorText(error)}</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : wide ? (
          <View style={styles.panes}>
            <View style={styles.listPane}>
              <NoteList notes={list} openId={openId} onOpen={openNote} onAdd={addNote} side />
            </View>

            <View style={styles.notePane}>
              {open ? (
                <NoteEditor note={open} wide onDeleted={() => setOpenId(null)} />
              ) : (
                <View style={styles.center}>
                  <Text style={styles.emptyTitle}>{kk.notes.emptyTitle}</Text>
                  <Text style={styles.emptyText}>{kk.notes.emptyText}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.phonePane}>
            <NoteList notes={list} onOpen={openNote} onAdd={addNote} />
          </View>
        )}

        {failed && <Text style={styles.error}>{failed}</Text>}
      </View>
    </KeyboardFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 10,
  },
  headPhone: { paddingHorizontal: gutter },
  headWide: { paddingHorizontal: 26 },
  headerTitle: {
    fontFamily: font.display, fontSize: 12, letterSpacing: 1.8, color: C.ink,
  },

  panes: { flex: 1, flexDirection: 'row', minHeight: 0 },
  listPane: { width: 300, paddingLeft: 26, paddingRight: 18 },
  notePane: { flex: 1, minWidth: 0, paddingHorizontal: 26 },
  phonePane: { ...centered, flex: 1, width: '100%', paddingHorizontal: gutter },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: font.bold, fontSize: 15, color: C.ink },
  emptyText: {
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 19,
    color: C.inkProse, textAlign: 'center', maxWidth: 340,
  },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, textAlign: 'center' },
});
