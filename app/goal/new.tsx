/**
 * ЖАҢА МАҚСАТ — ҚЫСҚА форма (CLAUDE.md §5.2b).
 *
 * ⚠ Мұнда КӨЛЕМ мен ЫРҒАҚ өрістері МҮЛДЕ ЖОҚ.
 *
 * Себебі: жылдық мақсат құрған сәтте адам «80 сабақ» дегенді әлі
 * білмейді — ол сан кейін, кезеңге бөлген кезде туады. Жүйе оны
 * мерзімнен шығарып бере алмайды (§5.2a: жүйе жоспарды өзі құрмайды).
 *
 * Сондықтан тек үшеуі сұралады: аты · мерзім · (міндетті емес) нәтиже.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { differenceInCalendarDays } from 'date-fns';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, t as tpl } from '../../i18n/kk';
import { termEndDate, type TermKey } from '../../lib/calendar';
import { useCreateGoal } from '../../lib/goals';
import { SectionLabel, DateField } from '../../components/ui';
import { CloseIcon, InfoIcon } from '../../components/icons';

const TERMS: { key: TermKey; label: string }[] = [
  { key: 'm3', label: kk.goalNew.terms.m3 },
  { key: 'm6', label: kk.goalNew.terms.m6 },
  { key: 'yearEnd', label: kk.goalNew.terms.yearEnd },
];

export default function NewGoalScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);

  const [title, setTitle] = useState('');
  const [term, setTerm] = useState<TermKey | null>('yearEnd');
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(() => termEndDate('yearEnd', today));

  // Нәтиже — А нүктесі мен Б нүктесі. Мәтін күйінде сақталады:
  // «84,2» деп үтірмен жазуға да болады.
  // ⚠ Бірлік өрісі әдейі ЖОҚ: «жүргізуші куәлігін алу» деген мақсаттың
  // нәтижесі кг да, теңге де емес. Бір өріс бүкіл мақсатты өлшемге
  // мәжбүрлемеуі керек.
  const [resultFrom, setResultFrom] = useState('');
  const [resultTo, setResultTo] = useState('');

  const [error, setError] = useState<string | null>(null);
  const create = useCreateGoal();

  const days = Math.max(differenceInCalendarDays(end, start) + 1, 0);
  const weeks = Math.max(Math.ceil(days / 7), 0);

  const pickTerm = (key: TermKey) => {
    setTerm(key);
    setEnd(termEndDate(key, start));
  };

  /** Басталу мерзімнен кейінге кетсе — мерзім соған ығысады */
  const pickStart = (d: Date) => {
    setStart(d);
    if (d.getTime() > end.getTime()) {
      setTerm(null);
      setEnd(d);
    }
  };

  /** Күнді қолмен таңдағанда жылдам нұсқа белгісі алынады */
  const pickEnd = (d: Date) => {
    setTerm(null);
    setEnd(d);
  };

  const submit = () => {
    setError(null);
    const name = title.trim();
    if (!name) return setError('Мақсаттың атауын жазыңыз.');
    if (end.getTime() < start.getTime()) {
      return setError('Мерзім басталу күнінен бұрын бола алмайды.');
    }

    create.mutate(
      {
        title: name,
        start,
        end,
        resultFrom: parseDecimal(resultFrom),
        resultTo: parseDecimal(resultTo),
      },
      {
        // Құрылған соң бірден мақсат бетіне — ол жерде «Бөлінбеген»
        // күйі мен «+ Кезең қосу» батырмасы тұрады
        onSuccess: (id) => router.replace(`/goal/${id}` as never),
        onError: (e) => setError(e instanceof Error ? e.message : kk.common.loadError),
      },
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityRole="button">
          <CloseIcon size={12} color={C.darkInk3} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.goalNew.title}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          ...centered,
          paddingHorizontal: gutter,
          paddingBottom: insets.bottom + 30,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Аты */}
        <View>
          <SectionLabel style={styles.fieldLabel}>{kk.goalNew.what}</SectionLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={kk.goalNew.whatPlaceholder}
            placeholderTextColor={C.ink4}
            style={styles.titleInput}
          />
        </View>

        {/* 2. Мерзім */}
        <View>
          <View style={styles.labelRow}>
            <SectionLabel>{kk.goalNew.deadline}</SectionLabel>
            <Text style={styles.hint}>{kk.goalNew.deadlineHint}</Text>
          </View>

          <View style={styles.chips}>
            {TERMS.map((t) => {
              const on = t.key === term;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => pickTerm(t.key)}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.chipText, on && { color: '#FFFFFF' }]}>{t.label}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setTerm(null)}
              style={[styles.chip, term === null && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: term === null }}
            >
              <Text style={[styles.chipText, term === null && { color: '#FFFFFF' }]}>
                {kk.goalNew.terms.custom}
              </Text>
            </Pressable>
          </View>

          <View style={styles.dates}>
            <DateField
              label={kk.goalNew.startLabel}
              value={start}
              onChange={pickStart}
            />
            <DateField
              label={kk.goalNew.endLabel}
              value={end}
              onChange={pickEnd}
              min={start}
              hint={tpl(kk.goalNew.span, { days, weeks })}
            />
          </View>
        </View>

        {/* 3. Нәтиже — міндетті емес, пайызға ҚАТЫСПАЙДЫ */}
        <View>
          <View style={styles.labelRow}>
            <SectionLabel>{kk.goalNew.result}</SectionLabel>
            <Text style={styles.hint}>{kk.goalNew.resultOptional}</Text>
          </View>

          <View style={styles.resultRow}>
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>{kk.goalNew.resultFrom}</Text>
              <TextInput
                value={resultFrom}
                onChangeText={setResultFrom}
                placeholder={kk.goalNew.resultFromPlaceholder}
                placeholderTextColor={C.ink4}
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={styles.resultInput}
              />
            </View>

            <Text style={styles.resultArrow}>→</Text>

            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>{kk.goalNew.resultTo}</Text>
              <TextInput
                value={resultTo}
                onChangeText={setResultTo}
                placeholder={kk.goalNew.resultToPlaceholder}
                placeholderTextColor={C.ink4}
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={styles.resultInput}
              />
            </View>
          </View>

          <Text style={styles.resultNote}>{kk.goalNew.resultNote}</Text>
        </View>

        {/* Келесі қадам — көлем мен ырғақ кезеңде сұралады */}
        <View style={styles.note}>
          <InfoIcon size={15} color={C.accentDeep} strokeWidth={2.2} />
          <Text style={styles.noteText}>
            {kk.goalNew.createdNext}. {kk.goalNew.note}
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={submit}
          disabled={create.isPending}
          style={[styles.submit, create.isPending && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          {create.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>{kk.goalNew.create}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** «84,2» да, «84.2» де қабылданады. Бос болса null. */
function parseDecimal(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (!t) return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 8,
  },
  close: {
    width: 28, height: 28, borderRadius: R.pill, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: font.display, fontSize: 12, letterSpacing: 1.92, color: C.ink },

  fieldLabel: { marginBottom: 8, paddingLeft: 4 },
  labelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, paddingLeft: 4, gap: 8,
  },
  hint: { fontFamily: font.title, fontSize: 10, color: C.ink4, flexShrink: 1 },

  titleInput: {
    borderWidth: 1.5, borderColor: C.line, borderRadius: R.field,
    backgroundColor: C.card, paddingHorizontal: 15, paddingVertical: 14,
    fontFamily: font.title, fontSize: 13.5, color: C.ink,
  },

  dates: { gap: 8, marginTop: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexGrow: 1, alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: R.chipSm, backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.lineField,
  },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontFamily: font.bold, fontSize: 11.5, color: C.darkInk3 },

  resultRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  resultCell: { flexGrow: 1, flexBasis: 0 },
  resultLabel: {
    fontFamily: font.bold, fontSize: 9, letterSpacing: 1.08,
    textTransform: 'uppercase', color: C.ink4, marginBottom: 6, paddingLeft: 2,
  },
  resultInput: {
    backgroundColor: C.card, borderRadius: R.field,
    borderWidth: 1.5, borderColor: C.line,
    paddingHorizontal: 13, paddingVertical: 12,
    fontFamily: font.bold, fontSize: 14, color: C.ink,
  },
  resultArrow: { fontFamily: font.bold, fontSize: 15, color: C.ink4, paddingBottom: 13 },
  resultNote: {
    fontFamily: font.prose, fontSize: 11, lineHeight: 17,
    color: C.ink4, marginTop: 9, paddingLeft: 4,
  },

  note: {
    flexDirection: 'row', gap: 10, backgroundColor: C.tint,
    borderRadius: R.field, paddingHorizontal: 15, paddingVertical: 12,
  },
  noteText: { fontFamily: font.body, fontSize: 11, lineHeight: 17, color: C.inkProse, flexShrink: 1 },

  error: {
    fontFamily: font.title, fontSize: 12.5, color: C.ink,
    backgroundColor: C.trackChip, borderRadius: R.sm,
    paddingHorizontal: 13, paddingVertical: 11,
  },

  submit: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 16,
    borderRadius: R.cardXs, backgroundColor: C.accent,
    shadowColor: C.accent, shadowOpacity: 0.3, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  submitText: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },
});
