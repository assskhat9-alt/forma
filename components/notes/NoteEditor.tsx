/**
 * Ашылған жазба — телефондағы «Заметкидегідей».
 *
 * Үлкен қалың тақырып, астында еркін мәтін. Қоршау да, карточка да
 * жоқ: бет — қағаздың өзі.
 *
 * ⚠ «Сақтау» түймесі ЖОҚ. Жазғаныңыз өзі сақталады: жазуды тоқтатқанда,
 * өрістен шыққанда және экраннан кеткенде.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDayMonth } from '../../i18n/kk';
import { errorText } from '../../lib/errors';
import { useAutosave } from '../../lib/autosave';
import {
  useSaveNote, useDeleteNote, parseStrokes, noteDate, type Stroke,
} from '../../lib/notes';
import type { Note } from '../../lib/database.types';
import { Canvas, type Tool } from './Canvas';
import {
  UndoIcon, TrashIcon,
  TextToolIcon, PenToolIcon, MarkerToolIcon, EraserToolIcon,
} from '../icons';

const TOOLS: { key: Tool | 'text'; name: string; Icon: typeof PenToolIcon }[] = [
  { key: 'text', name: kk.notes.tools.text, Icon: TextToolIcon },
  { key: 'pen', name: kk.notes.tools.pen, Icon: PenToolIcon },
  { key: 'marker', name: kk.notes.tools.marker, Icon: MarkerToolIcon },
  { key: 'eraser', name: kk.notes.tools.eraser, Icon: EraserToolIcon },
];

type Draft = { title: string; body: string; strokes: Stroke[] };

type Props = {
  note: Note;
  /** Өшірілген соң қайда бару керек — телефонда тізімге қайтады */
  onDeleted: () => void;
  wide: boolean;
};

export function NoteEditor({ note, onDeleted, wide }: Props) {
  const save = useSaveNote();
  const remove = useDeleteNote();

  const [title, setTitle] = useState(note.title ?? '');
  const [body, setBody] = useState(note.body ?? '');
  const [strokes, setStrokes] = useState<Stroke[]>(() => parseStrokes(note.strokes));
  const [toolIndex, setToolIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const auto = useAutosave<Draft>({
    onSave: async (d) => {
      await save.mutateAsync({ id: note.id, title: d.title.trim(), body: d.body, strokes: d.strokes });
    },
    onError: (e) => setError(errorText(e)),
  });

  /**
   * ⚠ Басқа жазбаға ауысқанда өрістер соның мазмұнымен толады. Тек
   * id ӨЗГЕРГЕНДЕ: әйтпесе автосақтау аяқталып, сұраныс жаңарған сайын
   * өріс серверден келген ескі мәтінмен ауысып, сол екі арада
   * жазғаныңыз жоғалып отырар еді.
   */
  const filledFor = useRef(note.id);
  useEffect(() => {
    if (filledFor.current === note.id) return;
    filledFor.current = note.id;
    setTitle(note.title ?? '');
    setBody(note.body ?? '');
    setStrokes(parseStrokes(note.strokes));
    setError(null);
    auto.reset();
  }, [note.id, note.title, note.body, note.strokes, auto]);

  const edit = (patch: Partial<Draft>) => {
    const next: Draft = { title, body, strokes, ...patch };
    if (patch.title !== undefined) setTitle(patch.title);
    if (patch.body !== undefined) setBody(patch.body);
    if (patch.strokes !== undefined) setStrokes(patch.strokes);
    auto.push(next);
  };

  const tool = TOOLS[toolIndex]!.key;
  const drawing = tool !== 'text';

  const drop = () => {
    setError(null);
    remove.mutate(note.id, {
      onSuccess: onDeleted,
      onError: (e) => setError(errorText(e)),
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <TextInput
          value={title}
          onChangeText={(v) => edit({ title: v })}
          onBlur={auto.flush}
          placeholder={kk.notes.titlePlaceholder}
          placeholderTextColor={C.ink4}
          style={styles.title}
          returnKeyType="done"
        />

        <Text style={styles.meta}>{formatDayMonth(noteDate(note))}</Text>

        <TextInput
          value={body}
          onChangeText={(v) => edit({ body: v })}
          onBlur={auto.flush}
          placeholder={kk.notes.bodyPlaceholder}
          placeholderTextColor={C.ink4}
          multiline
          textAlignVertical="top"
          style={styles.text}
          // Сурет салып тұрғанда мәтін өрісі кедергі жасамауы керек
          editable={!drawing}
        />

        <Canvas
          strokes={strokes}
          onChange={(next) => edit({ strokes: next })}
          tool={drawing ? (tool as Tool) : 'pen'}
          color={C.ink}
          height={wide ? 280 : 220}
        />

        {!drawing && <Text style={styles.hint}>{kk.notes.drawHint}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {/* ── Астыңғы тулбар ── */}
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

        <Pressable
          onPress={() => edit({ strokes: strokes.slice(0, -1) })}
          disabled={strokes.length === 0}
          style={[styles.tool, strokes.length === 0 && { opacity: 0.35 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.notes.undo}
        >
          <UndoIcon size={16} color={C.ink2} strokeWidth={2} />
        </Pressable>

        <View style={styles.state}>
          {auto.state === 'saving' && <ActivityIndicator color={C.ink4} size="small" />}
          <Text style={styles.stateText}>
            {auto.state === 'saving' || auto.state === 'typing'
              ? kk.notes.saving
              : auto.state === 'saved'
                ? kk.notes.saved
                : kk.notes.auto}
          </Text>
        </View>

        <Pressable
          onPress={drop}
          disabled={remove.isPending}
          style={styles.tool}
          accessibilityRole="button"
          accessibilityLabel={kk.common.delete}
        >
          <TrashIcon size={16} color={C.ink3} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 16, gap: 2 },

  title: {
    fontFamily: font.display,
    fontSize: 25,
    letterSpacing: -0.6,
    color: C.ink,
    paddingVertical: 4,
    outlineStyle: 'none' as never,
  },
  meta: { fontFamily: font.body, fontSize: 11.5, color: C.inkFaint, marginBottom: 8 },
  text: {
    minHeight: 160,
    fontFamily: font.prose,
    fontSize: 14,
    lineHeight: 22,
    color: C.inkProse,
    outlineStyle: 'none' as never,
  },
  hint: { fontFamily: font.body, fontSize: 11, color: C.ink4, marginTop: 8 },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, marginTop: 10 },

  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  tool: {
    width: 34, height: 34, borderRadius: R.chip,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.card,
  },
  toolOn: { backgroundColor: C.ink },
  state: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  stateText: { fontFamily: font.body, fontSize: 11, color: C.inkFaint },
});
