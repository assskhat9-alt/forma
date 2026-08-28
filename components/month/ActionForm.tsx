/**
 * ӘРЕКЕТ қосу терезесі.
 *
 * Жүйедегі жалғыз қолмен енгізілетін нәрсе. «Көлем» деген бөлек өріс
 * жоқ — көлем дегеніміз осылайша қосылған әрекеттердің саны.
 *
 * Өрістері: аты · күні · уақыты (міндетті емес) · қайталау (міндетті емес).
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, StyleSheet, ActivityIndicator,
} from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../../i18n/kk';
import { DateField } from '../ui/DatePicker';
import { CloseIcon } from '../icons';

/** Уақытсыз да қосуға болады — соңғысы `null` */
const TIMES: (string | null)[] = ['06:00', '08:00', '14:00', '21:00', null];

/** Қайталау: бір рет немесе N апта қатарынан */
const REPEATS = [1, 2, 4, 8];

export type ActionDraft = {
  title: string;
  date: Date;
  timeIndex: number;
  repeatIndex: number;
};

type Props = {
  visible: boolean;
  /** Аптаның шектері — күн сол аралықта ғана таңдалады */
  min: Date;
  max: Date;
  draft: ActionDraft;
  busy?: boolean;
  error?: string | null;
  onChange: (d: ActionDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ActionForm({
  visible, min, max, draft, busy, error, onChange, onClose, onSubmit,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.head}>
            <Text style={styles.title}>{kk.month.newAction}</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityRole="button">
              <CloseIcon size={12} color={C.darkInk3} />
            </Pressable>
          </View>

          {/* Аты */}
          <Text style={styles.label}>{kk.month.actionName}</Text>
          <TextInput
            value={draft.title}
            onChangeText={(title) => onChange({ ...draft, title })}
            placeholder={kk.month.actionPlaceholder}
            placeholderTextColor={C.ink4}
            style={styles.input}
            autoFocus
          />

          {/* Күні — аптаның ішінде ғана */}
          <Text style={[styles.label, { marginTop: 14 }]}>{kk.month.date}</Text>
          <DateField
            label={kk.month.date}
            value={draft.date}
            onChange={(date) => onChange({ ...draft, date })}
            min={min}
            max={max}
          />

          {/* Уақыты — міндетті емес */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>{kk.month.time}</Text>
            <Text style={styles.optional}>{kk.month.timeOptional}</Text>
          </View>
          <View style={styles.chips}>
            {TIMES.map((t, i) => {
              const on = i === draft.timeIndex;
              return (
                <Pressable
                  key={t ?? 'none'}
                  onPress={() => onChange({ ...draft, timeIndex: i })}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.chipText, on && { color: '#FFFFFF' }]}>
                    {t ?? kk.calendar.noTime}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Қайталау — міндетті емес */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>{kk.month.repeat}</Text>
            <Text style={styles.optional}>{kk.month.repeatOptional}</Text>
          </View>
          <View style={styles.chips}>
            {REPEATS.map((n, i) => {
              const on = i === draft.repeatIndex;
              return (
                <Pressable
                  key={n}
                  onPress={() => onChange({ ...draft, repeatIndex: i })}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.chipText, on && { color: '#FFFFFF' }]}>
                    {n === 1 ? kk.month.repeatOnce : tpl(kk.month.repeatWeeks, { n })}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={[styles.submit, busy && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {formatDayMonth(draft.date)} · {kk.month.add}
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,32,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: C.card,
    borderRadius: R.cardLg,
    padding: 20,
    shadowColor: '#14142D',
    shadowOpacity: 0.22,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  head: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  title: { fontFamily: font.bold, fontSize: 15, letterSpacing: -0.3, color: C.ink },
  close: {
    width: 28, height: 28, borderRadius: R.pill, backgroundColor: C.lineSoft,
    alignItems: 'center', justifyContent: 'center',
  },

  label: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14,
    textTransform: 'uppercase', color: C.ink3, marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 14,
  },
  optional: { fontFamily: font.title, fontSize: 10, color: C.ink4, marginBottom: 8 },

  input: {
    borderWidth: 1.5, borderColor: C.line, borderRadius: R.input,
    backgroundColor: C.cardSoft, paddingHorizontal: 15, paddingVertical: 13,
    fontFamily: font.body, fontSize: 13.5, color: C.ink,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: R.sm,
    backgroundColor: C.cardSoft, borderWidth: 1.5, borderColor: C.line,
  },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontFamily: font.bold, fontSize: 11.5, color: C.darkInk3 },

  error: {
    fontFamily: font.title, fontSize: 12, color: C.ink,
    backgroundColor: C.trackChip, borderRadius: R.sm,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 14,
  },

  submit: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 15,
    borderRadius: R.cardXs, backgroundColor: C.accent, marginTop: 18,
  },
  submitText: { fontFamily: font.bold, fontSize: 13, color: '#FFFFFF' },
});

export { TIMES, REPEATS };
