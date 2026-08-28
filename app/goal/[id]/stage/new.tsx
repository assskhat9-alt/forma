/**
 * ЖАҢА КЕЗЕҢ — ТОЛЫҚ форма (CLAUDE.md §5.2b).
 *
 * ⚠ §5.2a — ЖҮЙЕ ЖОСПАРДЫ ӨЗІ ҚҰРМАЙДЫ.
 *
 * Көлемді де, ырғақты да АДАМ қояды. Жүйе тек санайды:
 * «40 апта → 2 маусым 2027 бітеді». Ырғақ ата-ана мақсаттың мерзімінен
 * асып кетсе, ескерту мен үш шешім шығады — бірақ ЕШҚАЙСЫСЫ автоматты
 * қолданылмайды. Батырманы басқанда ғана тиісті өріс өзгереді.
 *
 * Ешбір өріс алдын ала толтырылмайды (§7.6): бос өріс + есептелген
 * салдар, осы ғана.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../../../theme/tokens';
import { kk, weekdaysShort, formatDayMonth, t as tpl } from '../../../../i18n/kk';
import { useGoals, useCreateStage } from '../../../../lib/goals';
import { errorText } from '../../../../lib/errors';
import { computeRhythm, weekDaysMatchRhythm } from '../../../../lib/rhythm';
import { Card, SectionLabel, DateField } from '../../../../components/ui';
import { CloseIcon, InfoIcon } from '../../../../components/icons';

/** §4: 'сабақ' | 'кітап' | 'жаттығу' | 'рет' | 'бет' */
const UNITS = ['сабақ', 'кітап', 'жаттығу', 'рет', 'бет'] as const;

export default function NewStageScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useMemo(() => new Date(), []);

  const { data: goals } = useGoals();
  const parent = (goals ?? []).find((g) => g.id === id) ?? null;
  const parentEnd = parent ? new Date(parent.period_end + 'T00:00:00') : null;

  const [title, setTitle] = useState('');
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState<Date>(() => parentEnd ?? today);

  // ⚠ Бос — алдын ала толтырылмайды (§7.6)
  const [amountText, setAmountText] = useState('');
  const [unit, setUnit] = useState('');
  const [perWeekText, setPerWeekText] = useState('');
  const [weekDays, setWeekDays] = useState<number[]>([]);

  const [error, setError] = useState<string | null>(null);
  const create = useCreateStage();

  const amount = Math.max(parseInt(amountText, 10) || 0, 0);
  const perWeek = Math.max(parseInt(perWeekText, 10) || 0, 0);

  // Жүйе ЕШТЕҢЕНІ өзгертпейді — тек салдарын есептейді
  const rhythm = computeRhythm({ amount, perWeek, start, deadline: parentEnd });
  const showConsequence = amount > 0 && perWeek > 0;
  const daysOk = weekDaysMatchRhythm(weekDays, perWeek);

  const toggleDay = (d: number) =>
    setWeekDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );

  const submit = () => {
    setError(null);
    const name = title.trim();
    if (!name) return setError('Кезеңнің атауын жазыңыз.');
    if (amount <= 0) return setError('Көлемін көрсетіңіз — қанша әрекет керек.');
    if (end.getTime() < start.getTime()) {
      return setError('Аяқталу күні басталудан бұрын бола алмайды.');
    }
    if (!parent) return setError('Ата-ана мақсат табылмады.');

    create.mutate(
      {
        parentId: parent.id,
        level: 'stage',
        title: name,
        start,
        end,
        targetAmount: amount,
        unit: unit.trim() || null,
        perWeek: perWeek > 0 ? perWeek : null,
        weekDays: weekDays.length > 0 ? weekDays : null,
      },
      {
        onSuccess: () => router.back(),
        onError: (e) => setError(errorText(e)),
      },
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityRole="button">
          <CloseIcon size={12} color={C.darkInk3} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.stageNew.title}</Text>
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
        {parent && (
          <Text style={styles.parentLine} numberOfLines={1}>
            {parent.title}
          </Text>
        )}

        {/* 1. Аты */}
        <View>
          <SectionLabel style={styles.fieldLabel}>{kk.stageNew.what}</SectionLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={kk.stageNew.placeholder}
            placeholderTextColor={C.ink4}
            style={styles.titleInput}
          />
        </View>

        {/* 2. Күндері */}
        <View>
          <SectionLabel style={styles.fieldLabel}>{kk.stageNew.dates}</SectionLabel>
          <View style={{ gap: 8 }}>
            <DateField label={kk.stageNew.startLabel} value={start} onChange={setStart} />
            <DateField
              label={kk.stageNew.endLabel}
              value={end}
              onChange={setEnd}
              min={start}
            />
          </View>
        </View>

        {/* 3. Көлемі — пайыз ТЕК осыдан */}
        <View>
          <View style={styles.labelRow}>
            <SectionLabel>{kk.stageNew.amount}</SectionLabel>
            <Text style={styles.hint}>{kk.stageNew.amountHint}</Text>
          </View>

          <View style={styles.amountRow}>
            <TextInput
              value={amountText}
              onChangeText={(v) => setAmountText(v.replace(/[^0-9]/g, ''))}
              placeholder="0"
              placeholderTextColor={C.ink4}
              keyboardType="number-pad"
              inputMode="numeric"
              style={styles.amountInput}
            />
            <TextInput
              value={unit}
              onChangeText={setUnit}
              placeholder={kk.stageNew.unitPlaceholder}
              placeholderTextColor={C.ink4}
              style={styles.unitInput}
            />
          </View>

          <View style={styles.unitChips}>
            {UNITS.map((u) => {
              const on = u === unit.trim();
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitChip, on && styles.unitChipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.unitChipText, on && { color: '#FFFFFF' }]}>{u}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 4. Ырғақ — АДАМ қояды */}
        <View>
          <View style={styles.labelRow}>
            <SectionLabel>{kk.stageNew.rhythm}</SectionLabel>
            <Text style={styles.hint}>{kk.stageNew.rhythmHint}</Text>
          </View>

          <View style={styles.perWeekRow}>
            <Text style={styles.perWeekLabel}>{kk.stageNew.perWeekLabel}</Text>
            <TextInput
              value={perWeekText}
              onChangeText={(v) => setPerWeekText(v.replace(/[^0-9]/g, ''))}
              placeholder="0"
              placeholderTextColor={C.ink4}
              keyboardType="number-pad"
              inputMode="numeric"
              style={styles.perWeekInput}
            />
            <Text style={styles.perWeekTimes}>{kk.stageNew.times}</Text>
          </View>

          <View style={[styles.labelRow, { marginTop: 14 }]}>
            <SectionLabel>{kk.stageNew.weekDays}</SectionLabel>
            <Text style={styles.hint}>{kk.stageNew.weekDaysHint}</Text>
          </View>

          <View style={styles.dayChips}>
            {weekdaysShort.map((label, i) => {
              const iso = i + 1; // 1 = дүйсенбі
              const on = weekDays.includes(iso);
              return (
                <Pressable
                  key={label}
                  onPress={() => toggleDay(iso)}
                  style={[styles.dayChip, on && styles.dayChipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.dayChipText, on && { color: '#FFFFFF' }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {!daysOk && <Text style={styles.mismatch}>{kk.stageNew.daysMismatch}</Text>}
        </View>

        {/* 5. ЕСЕПТЕЛГЕН САЛДАР — тек көрсету, өзгертілмейді */}
        <Card style={styles.consequence}>
          {showConsequence ? (
            <Text style={styles.consequenceText}>
              {tpl(kk.stageNew.consequence, {
                weeks: rhythm.weeksNeeded,
                date: `${formatDayMonth(rhythm.finishDate)} ${rhythm.finishDate.getFullYear()}`,
              })}
            </Text>
          ) : (
            <Text style={styles.consequenceEmpty}>{kk.stageNew.noRhythm}</Text>
          )}

          {showConsequence && !rhythm.fits && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠ {tpl(kk.stageNew.overWarning, { n: rhythm.weeksOver })}
              </Text>

              {/* Үш шешім — ЕШҚАЙСЫСЫ автоматты қолданылмайды */}
              <View style={styles.options}>
                {rhythm.options.perWeekToFit != null && (
                  <Pressable
                    onPress={() => setPerWeekText(String(rhythm.options.perWeekToFit))}
                    style={styles.option}
                    accessibilityRole="button"
                  >
                    <Text style={styles.optionText}>
                      {tpl(kk.stageNew.optPerWeek, { n: rhythm.options.perWeekToFit })}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setEnd(rhythm.options.moveDeadlineTo)}
                  style={styles.option}
                  accessibilityRole="button"
                >
                  <Text style={styles.optionText}>{kk.stageNew.optMoveDeadline}</Text>
                </Pressable>

                {rhythm.options.amountToFit != null && (
                  <Pressable
                    onPress={() => setAmountText(String(rhythm.options.amountToFit))}
                    style={styles.option}
                    accessibilityRole="button"
                  >
                    <Text style={styles.optionText}>{kk.stageNew.optReduceAmount}</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.optNote}>
                <InfoIcon size={13} color={C.inkMuted} strokeWidth={2.2} />
                <Text style={styles.optNoteText}>{kk.stageNew.optNote}</Text>
              </View>
            </View>
          )}
        </Card>

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
            <Text style={styles.submitText}>{kk.stageNew.create}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 8,
  },
  close: {
    width: 28, height: 28, borderRadius: R.pill, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: font.display, fontSize: 12, letterSpacing: 1.92, color: C.ink },
  parentLine: { fontFamily: font.title, fontSize: 12, color: C.inkMuted, paddingLeft: 4 },

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

  amountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: R.field,
    paddingHorizontal: 15, paddingVertical: 10,
  },
  amountInput: {
    fontFamily: font.display, fontSize: 20, letterSpacing: -0.6,
    color: C.ink, minWidth: 56, paddingVertical: 4,
  },
  unitInput: {
    fontFamily: font.title, fontSize: 12.5, color: C.darkInk3,
    flexGrow: 1, paddingVertical: 2,
  },
  unitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.lineField,
  },
  unitChipOn: { backgroundColor: C.accent, borderColor: C.accent },
  unitChipText: { fontFamily: font.bold, fontSize: 11, color: C.darkInk3 },

  perWeekRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: R.field,
    paddingHorizontal: 15, paddingVertical: 12,
  },
  perWeekLabel: { fontFamily: font.title, fontSize: 13, color: C.inkBody },
  perWeekInput: {
    fontFamily: font.display, fontSize: 20, letterSpacing: -0.6,
    color: C.ink, minWidth: 44, textAlign: 'center', paddingVertical: 2,
  },
  perWeekTimes: { fontFamily: font.title, fontSize: 13, color: C.inkBody },

  dayChips: { flexDirection: 'row', gap: 5 },
  dayChip: {
    flexGrow: 1, flexBasis: 0, alignItems: 'center', paddingVertical: 10,
    borderRadius: R.boxSm, backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.lineField,
  },
  dayChipOn: { backgroundColor: C.accent, borderColor: C.accent },
  dayChipText: { fontFamily: font.bold, fontSize: 11, color: C.darkInk3 },
  mismatch: {
    fontFamily: font.prose, fontSize: 11, lineHeight: 16,
    color: C.ink4, marginTop: 8, paddingLeft: 4,
  },

  consequence: { padding: 16 },
  consequenceText: { fontFamily: font.bold, fontSize: 15, color: C.ink, lineHeight: 21 },
  consequenceEmpty: { fontFamily: font.prose, fontSize: 12, lineHeight: 18, color: C.ink4 },

  warning: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.lineSoft },
  warningText: { fontFamily: font.bold, fontSize: 13, color: C.ink, lineHeight: 19 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  option: {
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: R.pill,
    backgroundColor: C.tint,
  },
  optionText: { fontFamily: font.bold, fontSize: 11.5, color: C.accentDeep },
  optNote: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 11 },
  optNoteText: { fontFamily: font.prose, fontSize: 10.5, color: C.inkMuted, flexShrink: 1 },

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
