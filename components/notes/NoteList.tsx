/**
 * Жазбалар тізімі — телефондағы «Заметкидегідей».
 *
 * Кезеңге бөлінген жолдар: қалың тақырып, астында күні мен мәтіннің
 * басы. Ешқандай карточка, көлеңке жоқ — тек жіңішке бөлгіш сызық.
 *
 * ⚠ Іздеу ТӨМЕНДЕ тұр: бір қолмен ұстағанда бас бармақ сол жерге
 * жетеді, ал тізімнің басына жетпейді.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDayMonth } from '../../i18n/kk';
import { groupNotes, noteDate, notePreview } from '../../lib/notes';
import type { Note } from '../../lib/database.types';
import { SearchIcon, PlusIcon } from '../icons';

type Props = {
  notes: Note[];
  openId?: string | null;
  onOpen: (id: string) => void;
  onAdd: () => void;
  /** Кең экранда тізім — бүйірдегі баған, ені шектеулі */
  side?: boolean;
};

export function NoteList({ notes, openId, onOpen, onAdd, side }: Props) {
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const found = needle
      ? notes.filter(
          (n) =>
            (n.title ?? '').toLowerCase().includes(needle) ||
            (n.body ?? '').toLowerCase().includes(needle),
        )
      : notes;
    return groupNotes(found);
  }, [notes, q]);

  const empty = groups.length === 0;

  return (
    <View style={[styles.root, side && styles.side]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {empty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {q.trim() ? kk.notes.nothingFound : kk.notes.emptyTitle}
            </Text>
            {!q.trim() && <Text style={styles.emptyText}>{kk.notes.emptyText}</Text>}
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.key}>
              <Text style={styles.group}>{g.label}</Text>

              <View style={styles.block}>
                {g.notes.map((n, i) => {
                  const on = n.id === openId;
                  const preview = notePreview(n);

                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => onOpen(n.id)}
                      style={[styles.row, i > 0 && styles.rowLine, on && styles.rowOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {n.title?.trim() || kk.notes.untitled}
                      </Text>

                      <View style={styles.meta}>
                        <Text style={styles.date}>{formatDayMonth(noteDate(n))}</Text>
                        {!!preview && (
                          <Text style={styles.preview} numberOfLines={1}>
                            {preview}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Астыңғы жолақ: іздеу + жаңа жазба ── */}
      <View style={styles.bar}>
        <View style={styles.search}>
          <SearchIcon size={15} color={C.ink4} strokeWidth={2} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={kk.notes.search}
            placeholderTextColor={C.ink4}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>

        <Pressable
          onPress={onAdd}
          style={styles.add}
          accessibilityRole="button"
          accessibilityLabel={kk.notes.add}
        >
          <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  side: { borderRightWidth: 1, borderRightColor: C.line },
  scroll: { paddingBottom: 18 },

  group: {
    fontFamily: font.bold,
    fontSize: 15,
    color: C.ink,
    paddingHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 8,
  },
  block: {
    backgroundColor: C.card,
    borderRadius: R.cardXs,
    overflow: 'hidden',
  },

  row: { paddingVertical: 11, paddingHorizontal: 14, gap: 3 },
  rowLine: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  rowOn: { backgroundColor: C.lineFaint },
  rowTitle: { fontFamily: font.title, fontSize: 14, color: C.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontFamily: font.body, fontSize: 11.5, color: C.inkFaint, flexShrink: 0 },
  preview: { fontFamily: font.body, fontSize: 11.5, color: C.ink4, flexShrink: 1 },

  empty: { paddingTop: 40, paddingHorizontal: 6, gap: 8 },
  emptyTitle: { fontFamily: font.bold, fontSize: 15, color: C.ink },
  emptyText: { fontFamily: font.body, fontSize: 12.5, lineHeight: 19, color: C.ink3 },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  search: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: R.chip,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.lineField,
  },
  searchInput: {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: font.body,
    fontSize: 13,
    color: C.ink,
    // Вебте фокус шеңбері дизайнға жат
    outlineStyle: 'none' as never,
  },
  add: {
    width: 40,
    height: 40,
    borderRadius: R.chip,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
