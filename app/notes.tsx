/**
 * МЕНІҢ ОЙЛАРЫМ (design/Oilarym.dc.html).
 *
 * ⚠ Мұнда пайыз да, мерзім де, «орындалды» да жоқ. Ой — есеп берілетін
 * нәрсе емес. Сондықтан бұл экран каскадқа мүлде қатыспайды.
 *
 * Жоғарыда — соңғы жазбалар жолағы, астында ашылған жазба: тақырып,
 * мәтін және сурет алаңы.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter, centered } from '../theme/tokens';
import { kk, formatDayMonth } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useBreakpoint } from '../lib/breakpoints';
import {
  useNotes, useCreateNote, useSaveNote, useDeleteNote, parseStrokes, type Stroke,
} from '../lib/notes';
import { Canvas, type Tool } from '../components/notes/Canvas';
import { Card, SectionLabel, AddButton } from '../components/ui';
import {
  ChevronLeftIcon, CloseIcon, UndoIcon,
  TextToolIcon, PenToolIcon, MarkerToolIcon, EraserToolIcon,
} from '../components/icons';

const TOOLS: { key: Tool | 'text'; name: string; Icon: typeof PenToolIcon }[] = [
  { key: 'text', name: kk.notes.tools.text, Icon: TextToolIcon },
  { key: 'pen', name: kk.notes.tools.pen, Icon: PenToolIcon },
  { key: 'marker', name: kk.notes.tools.marker, Icon: MarkerToolIcon },
  { key: 'eraser', name: kk.notes.tools.eraser, Icon: EraserToolIcon },
];

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';

  const { data: notes, isLoading, isError, error } = useNotes();
  const create = useCreateNote();
  const save = useSaveNote();
  const remove = useDeleteNote();

  const list = notes ?? [];

  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [toolIndex, setToolIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const open = list.find((n) => n.id === openId) ?? null;

  // Тізім жүктелгенде бірінші жазба ашылады
  useEffect(() => {
    if (!openId && list.length > 0) setOpenId(list[0]!.id);
  }, [list, openId]);

  // Басқа жазбаға ауысқанда өрістер соның мазмұнымен толады
  useEffect(() => {
    if (!open) return;
    setTitle(open.title ?? '');
    setBody(open.body ?? '');
    setStrokes(parseStrokes(open.strokes));
    setDirty(false);
  }, [open?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tool = TOOLS[toolIndex]!.key;
  const drawing = tool !== 'text';

  const persist = () => {
    if (!open) return;
    setNote(null);
    save.mutate(
      { id: open.id, title: title.trim(), body, strokes },
      { onSuccess: () => setDirty(false), onError: (e) => setNote(errorText(e)) },
    );
  };

  const addNote = () => {
    setNote(null);
    create.mutate(
      { title: '', body: '' },
      { onSuccess: (id) => setOpenId(id), onError: (e) => setNote(errorText(e)) },
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...centered,
        paddingTop: insets.top + (wide ? 18 : 12),
        paddingBottom: insets.bottom + 28,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.notes.title}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.body}>
        {isError ? (
          <Card style={styles.pad}>
            <Text style={styles.error}>{errorText(error)}</Text>
          </Card>
        ) : isLoading ? (
          <Card style={styles.pad}>
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          </Card>
        ) : (
          <>
            {/* ── Соңғы жазбалар ── */}
            {list.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.strip}
              >
                {list.map((n) => {
                  const on = n.id === openId;
                  const drawn = parseStrokes(n.strokes).length > 0;

                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => setOpenId(n.id)}
                      style={[styles.chip, on && styles.chipOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.chipDate, on && { color: C.accent2 }]}>
                        {formatDayMonth(new Date(n.updated_at ?? n.created_at))}
                      </Text>
                      <Text
                        style={[styles.chipTitle, on && { color: '#FFFFFF' }]}
                        numberOfLines={2}
                      >
                        {n.title?.trim() || kk.notes.untitled}
                      </Text>
                      {drawn && (
                        <View style={[styles.drawn, on && { backgroundColor: C.accent2 }]} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* ── Ашылған жазба ── */}
            {open ? (
              <Card style={styles.note}>
                <View style={styles.noteHead}>
                  <TextInput
                    value={title}
                    onChangeText={(v) => {
                      setTitle(v);
                      setDirty(true);
                    }}
                    placeholder={kk.notes.titlePlaceholder}
                    placeholderTextColor={C.ink4}
                    style={styles.title}
                  />

                  <Pressable
                    onPress={() => {
                      remove.mutate(open.id);
                      setOpenId(null);
                    }}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={kk.common.delete}
                  >
                    <CloseIcon size={13} color={C.ink4} />
                  </Pressable>
                </View>

                <Text style={styles.meta}>
                  {formatDayMonth(new Date(open.updated_at ?? open.created_at))}
                </Text>

                <TextInput
                  value={body}
                  onChangeText={(v) => {
                    setBody(v);
                    setDirty(true);
                  }}
                  placeholder={kk.notes.bodyPlaceholder}
                  placeholderTextColor={C.ink4}
                  multiline
                  textAlignVertical="top"
                  style={styles.text}
                  // Сурет салып тұрғанда мәтін өрісі кедергі жасамауы керек
                  editable={!drawing}
                />

                {/* ── Тулбар ── */}
                <View style={styles.tools}>
                  {TOOLS.map((t, i) => {
                    const on = toolIndex === i;
                    return (
                      <Pressable
                        key={t.key}
                        onPress={() => setToolIndex(i)}
                        style={[styles.tool, on && styles.toolOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={t.name}
                      >
                        <t.Icon size={16} color={on ? '#FFFFFF' : C.ink2} strokeWidth={2} />
                      </Pressable>
                    );
                  })}

                  <View style={{ flexGrow: 1 }} />

                  <Pressable
                    onPress={() => {
                      setStrokes((s) => s.slice(0, -1));
                      setDirty(true);
                    }}
                    disabled={strokes.length === 0}
                    style={[styles.tool, strokes.length === 0 && { opacity: 0.35 }]}
                    accessibilityRole="button"
                    accessibilityLabel={kk.notes.undo}
                  >
                    <UndoIcon size={16} color={C.ink2} strokeWidth={2} />
                  </Pressable>
                </View>

                <Canvas
                  strokes={strokes}
                  onChange={(next) => {
                    setStrokes(next);
                    setDirty(true);
                  }}
                  tool={drawing ? (tool as Tool) : 'pen'}
                  color={C.ink}
                  height={wide ? 280 : 220}
                />

                {!drawing && <Text style={styles.hint}>{kk.notes.drawHint}</Text>}

                <Pressable
                  onPress={persist}
                  disabled={!dirty || save.isPending}
                  style={[styles.save, (!dirty || save.isPending) && { opacity: 0.45 }]}
                  accessibilityRole="button"
                >
                  {save.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveText}>
                      {dirty ? kk.notes.save : kk.notes.saved}
                    </Text>
                  )}
                </Pressable>

                {note && <Text style={styles.error}>{note}</Text>}
              </Card>
            ) : (
              <Card style={styles.pad}>
                <SectionLabel>{kk.notes.emptyTitle}</SectionLabel>
                <Text style={styles.emptyText}>{kk.notes.emptyText}</Text>
              </Card>
            )}

            <AddButton label={kk.notes.add} onPress={addNote} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: font.display, fontSize: 12, letterSpacing: 1.8, color: C.ink,
  },

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  center: { paddingVertical: 26, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, marginTop: 10 },

  strip: { gap: 9, paddingRight: 2 },
  chip: {
    width: 132, height: 88, borderRadius: R.cardXs, padding: 11,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line,
  },
  chipOn: { backgroundColor: C.darkBg, borderColor: C.darkBg },
  chipDate: { fontFamily: font.bold, fontSize: 8.5, letterSpacing: 0.5, color: C.ink4 },
  chipTitle: {
    fontFamily: font.bold, fontSize: 10.5, lineHeight: 14,
    color: C.ink, marginTop: 6,
  },
  drawn: {
    width: 24, height: 2, borderRadius: 999,
    backgroundColor: C.accent5, marginTop: 6,
  },

  note: { padding: 18 },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    flexGrow: 1, flexShrink: 1, minWidth: 0,
    fontFamily: font.bold, fontSize: 16, letterSpacing: -0.32, color: C.ink,
    outlineStyle: 'none' as never,
  },
  meta: { fontFamily: font.bold, fontSize: 10.5, color: C.ink4, marginTop: 4 },

  text: {
    minHeight: 90, marginTop: 14,
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 20, color: C.inkProse,
    outlineStyle: 'none' as never,
  },

  tools: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 12 },
  tool: {
    width: 36, height: 36, borderRadius: R.chipSm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardSoft, borderWidth: 1, borderColor: C.line,
  },
  toolOn: { backgroundColor: C.accent, borderColor: C.accent },

  hint: {
    fontFamily: font.prose, fontSize: 11, lineHeight: 16,
    color: C.ink4, marginTop: 9,
  },

  save: {
    marginTop: 14, height: 46, borderRadius: R.sm, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  saveText: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },

  emptyText: {
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 19,
    color: C.inkProse, marginTop: 8,
  },
});
