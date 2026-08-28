/**
 * ЖАҢА МАҚСАТ — design/MaqsatQosu.dc.html.
 *
 * Мұнда адам мерзім мен көлемді таңдайды, ал жүйе жүктемені айларға
 * өзі бөледі. Сол бөлу `goals` кестесіне level='month' жолдары болып
 * жазылады, ал олардың `weight` мәні planned_progress() есебінің
 * НЕГІЗІ болады (CLAUDE.md §5.2).
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, monthsShort, t as tpl } from '../../i18n/kk';
import { buildPlan, summarize, termEndDate, type Curve, type TermKey } from '../../lib/plan';
import { useCreateGoal } from '../../lib/goals';
import { Card, SectionLabel, DateField } from '../../components/ui';
import { CloseIcon, InfoIcon } from '../../components/icons';

/** Бір дананың шамамен ұзақтығы — макеттегі мән */
const MINUTES_PER_UNIT = 45;

/**
 * Жылдам нұсқалар — тек ыңғайлылық үшін.
 * Нақты күндерді төмендегі екі өрістен таңдайды, сондықтан «Өз күнім»
 * деген жеке чип керек емес: кез келген күнді қоюға болады.
 */
const TERMS: { key: TermKey; label: string }[] = [
  { key: 'm3', label: kk.goalNew.terms.m3 },
  { key: 'm6', label: kk.goalNew.terms.m6 },
  { key: 'yearEnd', label: kk.goalNew.terms.yearEnd },
];

/**
 * Жиі кездесетін бірліктер. Тізім жабық емес — өрісті қолмен де
 * толтыруға болады, чиптер тек жылдам таңдау.
 */
const UNITS = ['сабақ', 'кітап', 'жаттығу', 'рет', 'бет'] as const;

const CURVES: { key: Curve; label: string; note: string }[] = [
  { key: 'even', label: kk.goalNew.curves.even, note: kk.goalNew.curveNotes.even },
  { key: 'front', label: kk.goalNew.curves.front, note: kk.goalNew.curveNotes.front },
  { key: 'back', label: kk.goalNew.curves.back, note: kk.goalNew.curveNotes.back },
];

export default function NewGoalScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);

  const [title, setTitle] = useState('');
  const [term, setTerm] = useState<TermKey | null>('yearEnd');
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(() => termEndDate('yearEnd', today));
  const [amountText, setAmountText] = useState('80');
  const [unit, setUnit] = useState<string>(UNITS[0]);
  // Нәтиже мәтін күйінде сақталады: «84,2» деп үтірмен жазуға да болады
  const [resultFrom, setResultFrom] = useState('');
  const [resultTo, setResultTo] = useState('');
  const [resultUnit, setResultUnit] = useState('');
  const [curve, setCurve] = useState<Curve>('even');
  const [error, setError] = useState<string | null>(null);

  const create = useCreateGoal();

  /** Жылдам нұсқа таңдалғанда мерзім соған теңеледі */
  const pickTerm = (key: TermKey) => {
    setTerm(key);
    setEnd(termEndDate(key, start));
  };

  /** Күнді қолмен таңдағанда жылдам нұсқа белгісі алынады */
  const pickEnd = (d: Date) => {
    setTerm(null);
    setEnd(d);
  };

  const pickStart = (d: Date) => {
    setStart(d);
    // Басталу мерзімнен кейін болып қалса — мерзімді ығыстырамыз
    if (d.getTime() > end.getTime()) {
      setTerm(null);
      setEnd(d);
    }
  };

  const amount = Math.max(parseInt(amountText, 10) || 0, 0);
  const rFrom = parseDecimal(resultFrom);
  const rTo = parseDecimal(resultTo);
  const sum = summarize(start, end, amount || 1, MINUTES_PER_UNIT);
  const plan = buildPlan(start, end, amount || 1, curve);

  const shown = plan.slice(0, 6);
  const maxAmount = Math.max(...shown.map((b) => b.amount), 1);
  const curveNote = CURVES.find((c) => c.key === curve)!.note;

  const submit = () => {
    setError(null);
    const name = title.trim();
    if (!name) return setError('Мақсаттың атауын жазыңыз.');
    if (amount <= 0) return setError('Көлемін көрсетіңіз — қанша дана керек.');
    if (end.getTime() < start.getTime()) {
      return setError('Мерзім басталу күнінен бұрын бола алмайды.');
    }

    create.mutate(
      {
        title: name,
        start,
        end,
        targetAmount: amount,
        unit: unit.trim() || null,
        curve,
        // Нәтиже пайызға қатыспайды — тек көрсету үшін сақталады
        resultFrom: rFrom,
        resultTo: rTo,
        resultUnit: resultUnit.trim() || null,
      },
      {
        onSuccess: () => router.back(),
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
        contentContainerStyle={{ ...centered, paddingHorizontal: gutter, paddingBottom: insets.bottom + 30, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* атауы */}
        <View>
          <SectionLabel style={styles.fieldLabel}>{kk.goalNew.what}</SectionLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ағылшын тілін C1 деңгейіне жеткізу"
            placeholderTextColor={C.ink4}
            style={styles.titleInput}
          />
        </View>

        {/* кезең — күндерді қолданушы өзі таңдайды */}
        <View>
          <View style={styles.labelRow}>
            <SectionLabel>{kk.goalNew.deadline}</SectionLabel>
            <Text style={styles.hint}>{kk.goalNew.deadlineHint}</Text>
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
              hint={tpl(kk.goalNew.span, { days: sum.days, weeks: sum.weeks })}
            />
          </View>

          {/* жылдам нұсқалар — мерзімді бір басумен қояды */}
          <Text style={styles.quickLabel}>{kk.goalNew.quick}</Text>
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
          </View>
        </View>

        {/* ӘРЕКЕТ — пайыз ТЕК осыдан есептеледі */}
        <View>
          <View style={styles.labelRow}>
            <SectionLabel>{kk.goalNew.action}</SectionLabel>
            <Text style={styles.hint}>{kk.goalNew.actionHint}</Text>
          </View>

          <View style={styles.amountRow}>
            <TextInput
              value={amountText}
              onChangeText={(v) => setAmountText(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              inputMode="numeric"
              style={styles.amountInput}
            />
            <TextInput
              value={unit}
              onChangeText={setUnit}
              placeholder={UNITS[0]}
              placeholderTextColor={C.ink4}
              style={styles.unitInput}
            />
            <Text style={styles.amountHint}>
              ≈ {Math.round((amount * MINUTES_PER_UNIT) / 60)} сағат
            </Text>
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

        {/* НӘТИЖЕ — міндетті емес, пайызға ҚАТЫСПАЙДЫ */}
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
                placeholder="84,2"
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
                placeholder="78"
                placeholderTextColor={C.ink4}
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={styles.resultInput}
              />
            </View>

            <View style={[styles.resultCell, { flexGrow: 0.7 }]}>
              <Text style={styles.resultLabel}>{kk.goalNew.resultUnit}</Text>
              <TextInput
                value={resultUnit}
                onChangeText={setResultUnit}
                placeholder="кг"
                placeholderTextColor={C.ink4}
                style={styles.resultInput}
              />
            </View>
          </View>

          <Text style={styles.resultNote}>{kk.goalNew.resultNote}</Text>
        </View>

        {/* автоматты тарату */}
        <Card style={styles.planCard}>
          <View style={styles.labelRow}>
            <SectionLabel>{kk.goalNew.distribution}</SectionLabel>
            <View style={styles.curveChips}>
              {CURVES.map((c) => {
                const on = c.key === curve;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setCurve(c.key)}
                    style={[styles.curveChip, on && styles.curveChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.curveText, on && { color: '#FFFFFF' }]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryLeft}>
              <Text style={styles.perWeek}>{sum.perWeek}</Text>
              <Text style={styles.perWeekLabel}>{kk.goalNew.perWeek}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.perDay}>
                {tpl(kk.goalNew.perDay, { n: sum.perDayMinutes })}
              </Text>
              <Text style={styles.splitNote}>
                {tpl(kk.goalNew.splitInto, {
                  n: plan.length > 6 ? `${plan.length} (алғашқы 6-ы)` : plan.length,
                  note: curveNote,
                })}
              </Text>
            </View>
          </View>

          {/* айлық бағандар */}
          <View style={styles.bars}>
            {shown.map((b, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValue}>{b.amount}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(Math.round((b.amount / maxAmount) * 54), 6),
                      backgroundColor: i === 0 ? C.accent : C.accentSoft,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{monthsShort[b.monthIndex]}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.note}>
          <InfoIcon size={15} color={C.accentDeep} strokeWidth={2.2} />
          <Text style={styles.noteText}>{kk.goalNew.note}</Text>
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

  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    flexGrow: 1, flexBasis: 0, alignItems: 'center', paddingVertical: 11,
    borderRadius: R.chipSm, backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.lineField,
  },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontFamily: font.bold, fontSize: 11.5, color: C.darkInk3 },

  dates: { gap: 8 },
  quickLabel: {
    fontFamily: font.bold, fontSize: 9, letterSpacing: 1.17,
    textTransform: 'uppercase', color: C.ink4,
    marginTop: 14, marginBottom: 8, paddingLeft: 4,
  },

  amountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, borderRadius: R.field,
    paddingHorizontal: 15, paddingVertical: 10,
  },
  amountInput: {
    fontFamily: font.display, fontSize: 20, letterSpacing: -0.6, color: C.ink,
    minWidth: 46, paddingVertical: Platform.OS === 'web' ? 4 : 2,
  },
  unitInput: {
    fontFamily: font.title, fontSize: 12.5, color: C.darkInk3,
    flexGrow: 1, flexShrink: 1, paddingVertical: 2,
  },
  amountHint: { fontFamily: font.title, fontSize: 10.5, color: C.inkFaint, flexShrink: 0 },

  unitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.lineField,
  },
  unitChipOn: { backgroundColor: C.accent, borderColor: C.accent },
  unitChipText: { fontFamily: font.bold, fontSize: 11, color: C.darkInk3 },

  resultRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  resultCell: { flexGrow: 1, flexBasis: 0 },
  resultLabel: {
    fontFamily: font.bold, fontSize: 9, letterSpacing: 1.17,
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

  planCard: { padding: 17 },
  curveChips: { flexDirection: 'row', gap: 4 },
  curveChip: {
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: R.pill,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.lineField,
  },
  curveChipOn: { backgroundColor: C.ink, borderColor: C.ink },
  curveText: { fontFamily: font.bold, fontSize: 9.5, color: C.inkMuted },

  summary: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.tintSoft, borderWidth: 1, borderColor: C.tintLine,
    borderRadius: R.field, paddingHorizontal: 15, paddingVertical: 13,
  },
  summaryLeft: { alignItems: 'center', flexShrink: 0 },
  perWeek: { fontFamily: font.display, fontSize: 26, letterSpacing: -1.04, color: C.accentDeep },
  perWeekLabel: { fontFamily: font.bold, fontSize: 9, letterSpacing: 0.72, color: C.ink3, marginTop: 4 },
  summaryDivider: { width: 1, height: 38, backgroundColor: C.accentLine3 },
  perDay: { fontFamily: font.bold, fontSize: 13, color: C.ink },
  splitNote: { fontFamily: font.body, fontSize: 10.5, color: C.inkSoft, marginTop: 3 },

  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 84, marginTop: 14 },
  barCol: { flexGrow: 1, flexBasis: 0, alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  barValue: { fontFamily: font.bold, fontSize: 8.5, color: C.ink3 },
  bar: { width: '100%', borderRadius: R.micro },
  barLabel: { fontFamily: font.bold, fontSize: 8, color: C.ink4 },

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
