/**
 * ӘРЕКЕТ қосу терезесі.
 *
 * Жүйедегі жалғыз қолмен енгізілетін нәрсе. «Көлем» деген бөлек өріс
 * жоқ — көлем дегеніміз осылайша қосылған әрекеттердің саны.
 *
 * ⚠ Күнді таңдауда «тек осы айға» деген ШЕКТЕУ ЖОҚ. Басқа айдың күнін
 * таңдасаңыз, әрекет сол айға өзі көшеді. Тек мақсаттың мерзімінен
 * шығып кетуге болмайды.
 *
 * ⚠ Уақыт — МІНДЕТТІ ЕМЕС. Қойған жағдайда тәуліктің кез келген сәті
 * болады, дайын нұсқалармен шектелмейді.
 */
import React from 'react';
import {
  View, Text, TextInput, Pressable, Modal, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../../i18n/kk';
import { DateField } from '../ui/DatePicker';
import { Toggle } from '../ui/Toggle';
import { CloseIcon } from '../icons';

/** Жиі кездесетін уақыттар — тек жылдам таңдау, шектеу емес */
const QUICK_TIMES = ['06:00', '08:00', '12:00', '18:00', '21:00'];

/** Қайталау: бір рет немесе N апта қатарынан */
export const REPEATS = [1, 2, 4, 8, 12];

export type ActionDraft = {
  title: string;
  date: Date;
  /** `null` — уақытсыз */
  time: string | null;
  repeatIndex: number;
};

type Props = {
  visible: boolean;
  /** Мақсаттың мерзімі — одан тыс күн таңдалмайды */
  min?: Date;
  max?: Date;
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
  const [h, m] = (draft.time ?? '09:00').split(':');

  const setTime = (hour: string, minute: string) => {
    const hh = clamp(hour, 23);
    const mm = clamp(minute, 59);
    onChange({ ...draft, time: `${hh}:${mm}` });
  };

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

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

            {/* Күні — кез келген айға түсуі мүмкін */}
            <View style={{ marginTop: 14 }}>
              <DateField
                label={kk.month.date}
                value={draft.date}
                onChange={(date) => onChange({ ...draft, date })}
                min={min}
                max={max}
              />
            </View>

            {/* Уақыты — МІНДЕТТІ ЕМЕС */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>{kk.month.time}</Text>
              <View style={styles.toggleWrap}>
                <Text style={styles.optional}>
                  {draft.time ? kk.month.setTime : kk.month.timeOptional}
                </Text>
                <Toggle
                  value={draft.time != null}
                  onChange={(on) => onChange({ ...draft, time: on ? '09:00' : null })}
                  width={44}
                  height={26}
                />
              </View>
            </View>

            {draft.time != null && (
              <>
                <View style={styles.timeRow}>
                  <TextInput
                    value={h ?? '09'}
                    onChangeText={(v) => setTime(v.replace(/[^0-9]/g, ''), m ?? '00')}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={2}
                    style={styles.timeInput}
                  />
                  <Text style={styles.timeUnit}>{kk.month.hour}</Text>

                  <Text style={styles.timeColon}>:</Text>

                  <TextInput
                    value={m ?? '00'}
                    onChangeText={(v) => setTime(h ?? '09', v.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={2}
                    style={styles.timeInput}
                  />
                  <Text style={styles.timeUnit}>{kk.month.minute}</Text>
                </View>

                <View style={styles.chips}>
                  {QUICK_TIMES.map((t) => {
                    const on = draft.time === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => onChange({ ...draft, time: t })}
                        style={[styles.chip, on && styles.chipOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <Text style={[styles.chipText, on && { color: '#FFFFFF' }]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

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
          </ScrollView>

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
                {formatDayMonth(draft.date)}
                {draft.time ? ` · ${draft.time}` : ''} · {kk.month.add}
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Екі таңбаға келтіріп, ауқымнан шығармайды */
function clamp(v: string, max: number): string {
  const n = Math.min(Math.max(parseInt(v, 10) || 0, 0), max);
  return String(n).padStart(2, '0');
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
    maxHeight: '88%',
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
    justifyContent: 'space-between', marginTop: 16,
  },
  toggleWrap: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  optional: { fontFamily: font.title, fontSize: 10, color: C.ink4 },

  input: {
    borderWidth: 1.5, borderColor: C.line, borderRadius: R.input,
    backgroundColor: C.cardSoft, paddingHorizontal: 15, paddingVertical: 13,
    fontFamily: font.body, fontSize: 13.5, color: C.ink,
  },

  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardSoft, borderWidth: 1.5, borderColor: C.line,
    borderRadius: R.input, paddingHorizontal: 15, paddingVertical: 10,
  },
  timeInput: {
    fontFamily: font.display, fontSize: 22, letterSpacing: -0.66,
    color: C.ink, minWidth: 42, textAlign: 'center', paddingVertical: 2,
  },
  timeUnit: { fontFamily: font.title, fontSize: 11, color: C.ink4 },
  timeColon: { fontFamily: font.display, fontSize: 20, color: C.ink4, marginHorizontal: 2 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
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
