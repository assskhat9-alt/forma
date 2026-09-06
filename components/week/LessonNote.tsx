/**
 * АПТАНЫҢ САБАҒЫ — телефондағы «Заметки» сияқты.
 *
 * ⚠ Екі көрініс, ауыспалы:
 *   1) ТІЗІМ — кезеңге бөлінген жолдар. Әр жолда қалың тақырып,
 *      астында күні мен мәтіннің жалғасы;
 *   2) ЖАЗБА — жолды басқанда сол жерде ашылады, ‹ арқылы тізімге
 *      қайтады.
 *
 * ⚠ Бөлек «тақырып» өрісі ЖОҚ. Заметкидегідей бірінші жол тақырып
 * болады: адам ештеңе толтырмайды, жай жаза береді.
 *
 * ⚠ «Сақтау» түймесі де жоқ — жазғаныңыз өзі сақталады.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDayMonth } from '../../i18n/kk';
import { groupByPeriod, firstLine, restLine } from '../../lib/notes.format';
import type { SaveState } from '../../lib/autosave';
import { ChevronLeftIcon, PencilIcon } from '../icons';

export type WeekLesson = { id: string; body: string | null; created_at: string };

type Props = {
  /** Ашық тұрған аптаның аты — жазбаның «мұқабасы» */
  weekLabel: string;
  /** Барлық апта сабақтары — тізімге */
  lessons: WeekLesson[];
  /** Ашық тұрған аптаның жазбасы (әлі жазылмаса — null) */
  currentId: string | null;

  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  state: SaveState;

  /** Басқа аптаның жолын басқанда экран сол аптаға көшеді */
  onOpen: (date: Date) => void;
};

export function LessonNote({
  weekLabel, lessons, currentId, value, onChange, onBlur, state, onOpen,
}: Props) {
  const [open, setOpen] = useState(false);

  const groups = groupByPeriod(lessons, (l) => new Date(l.created_at));

  const status =
    state === 'saving' || state === 'typing'
      ? kk.week.lessonSaving
      : state === 'saved' || currentId
        ? kk.week.lessonSaved
        : kk.week.lessonAuto;

  // ── ЖАЗБА ──────────────────────────────────────────────────────────
  if (open) {
    return (
      <View style={styles.root}>
        <Pressable
          onPress={() => {
            onBlur(); // тізімге қайтпас бұрын жазылмағанын жіберіп үлгереміз
            setOpen(false);
          }}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={kk.common.back}
        >
          <ChevronLeftIcon size={16} color={C.ink3} strokeWidth={2.4} />
          <Text style={styles.backText}>{kk.week.lesson}</Text>
        </Pressable>

        <Text style={styles.cover}>{weekLabel}</Text>

        <TextInput
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          placeholder={kk.week.lessonPlaceholder}
          placeholderTextColor={C.ink4}
          multiline
          textAlignVertical="top"
          style={styles.text}
          autoFocus
        />

        <View style={styles.status}>
          {state === 'saving' && <ActivityIndicator color={C.ink4} size="small" />}
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    );
  }

  // ── ТІЗІМ ──────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.compose}
        accessibilityRole="button"
      >
        <PencilIcon size={15} color={C.ink2} strokeWidth={2} />
        <Text style={styles.composeText}>
          {currentId ? kk.week.lessonEdit : kk.week.lessonWrite}
        </Text>
        <Text style={styles.composeWeek} numberOfLines={1}>{weekLabel}</Text>
      </Pressable>

      {groups.length === 0 ? (
        <Text style={styles.empty}>{kk.week.lessonEmpty}</Text>
      ) : (
        groups.map((g) => (
          <View key={g.key}>
            <Text style={styles.group}>{g.label}</Text>

            <View style={styles.block}>
              {g.items.map((l, i) => {
                const head = firstLine(l.body);
                const tail = restLine(l.body);
                const d = new Date(l.created_at);
                const mine = l.id === currentId;

                return (
                  <Pressable
                    key={l.id}
                    onPress={() => {
                      // Басқа аптаныкі болса — алдымен экран сол аптаға көшеді
                      if (!mine) onOpen(d);
                      setOpen(true);
                    }}
                    style={[styles.row, i > 0 && styles.rowLine]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {head || kk.week.lessonUntitled}
                    </Text>

                    <View style={styles.meta}>
                      <Text style={styles.date}>{formatDayMonth(d)}</Text>
                      {!!tail && (
                        <Text style={styles.preview} numberOfLines={1}>
                          {tail}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 2 },

  // ── Жазба ──
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  backText: { fontFamily: font.title, fontSize: 12.5, color: C.ink3 },
  cover: {
    fontFamily: font.display, fontSize: 22, letterSpacing: -0.55,
    color: C.ink, paddingTop: 6,
  },
  text: {
    minHeight: 150, marginTop: 8,
    fontFamily: font.prose, fontSize: 14, lineHeight: 22, color: C.inkProse,
    // Вебте фокус шеңбері дизайнға жат
    outlineStyle: 'none' as never,
  },
  status: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    minHeight: 20, marginTop: 6,
  },
  statusText: { fontFamily: font.body, fontSize: 11.5, color: C.inkFaint },

  // ── Тізім ──
  compose: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: C.card, borderRadius: R.cardXs,
    borderWidth: 1.5, borderColor: C.lineField,
  },
  composeText: { fontFamily: font.title, fontSize: 13.5, color: C.ink, flexShrink: 0 },
  composeWeek: {
    flexGrow: 1, flexShrink: 1, textAlign: 'right',
    fontFamily: font.body, fontSize: 11.5, color: C.inkFaint,
  },

  empty: {
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 19,
    color: C.ink3, paddingTop: 14, paddingHorizontal: 4,
  },

  group: {
    fontFamily: font.bold, fontSize: 13.5, color: C.ink,
    paddingTop: 18, paddingBottom: 8,
  },
  block: { backgroundColor: C.card, borderRadius: R.cardXs, overflow: 'hidden' },

  row: { paddingVertical: 11, paddingHorizontal: 14, gap: 3 },
  rowLine: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  rowTitle: { fontFamily: font.title, fontSize: 14, color: C.ink },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontFamily: font.body, fontSize: 11.5, color: C.inkFaint, flexShrink: 0 },
  preview: { fontFamily: font.body, fontSize: 11.5, color: C.ink4, flexShrink: 1 },
});
