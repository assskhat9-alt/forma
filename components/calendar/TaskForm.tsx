/**
 * Жаңа тапсырма бланкасы.
 *
 * Телефонда — төменнен шығатын парақ, ай торы жоғарыда ЖИЫРЫЛЫП тұрады.
 * Планшет/ПК-де — оң жақтан сырғып шығатын панель.
 *
 * Екеуінде де күн календарьдан таңдалады: бланка ашық тұрғанда да
 * басқа күнді басуға болады (CLAUDE.md §7.1).
 */
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { SectionLabel } from '../ui';
import { CloseIcon } from '../icons';
import { kk, formatDayMonthWeekday } from '../../i18n/kk';
import { useRootGoals } from '../../lib/goals';

const TIMES = ['06:00', '08:00', '14:00', '21:00', kk.calendar.noTime];
const REPEATS = [kk.calendar.repeats.once, kk.calendar.repeats.daily, kk.calendar.repeats.weekly];

export type TaskDraft = {
  title: string;
  timeIndex: number;
  goalIndex: number;
  repeatIndex: number;
};

type Props = {
  date: Date;
  draft: TaskDraft;
  onChange: (next: TaskDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
  /** Панель нұсқасында тақырып қатары мен ені өзгереді */
  variant: 'sheet' | 'panel';
  width?: number;
};

export function TaskForm({ date, draft, onChange, onClose, onSubmit, variant, width }: Props) {
  const panel = variant === 'panel';
  const goals = useRootGoals();

  return (
    <View style={[panel ? styles.panel : styles.sheet, panel && width ? { width } : null]}>
      {!panel && <View style={styles.grabber} />}

      <View style={styles.head}>
        <Text style={styles.headTitle}>{kk.calendar.newTask}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
          <CloseIcon size={13} color={C.darkInk3} />
        </Pressable>
      </View>

      {/* Таңдалған күн — календарьмен тірі байланыс */}
      <View style={styles.dateRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateNum}>{date.getDate()}</Text>
        </View>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Text style={styles.dateLong}>{formatDayMonthWeekday(date)}</Text>
          <Text style={styles.dateHint}>{kk.calendar.changeDateHint}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1 }}>
        <Field label={kk.calendar.taskLabel}>
          <TextInput
            value={draft.title}
            onChangeText={(title) => onChange({ ...draft, title })}
            placeholder={kk.calendar.taskPlaceholder}
            placeholderTextColor={C.ink4}
            style={styles.input}
          />
        </Field>

        <Field label={kk.calendar.time}>
          <Options
            items={TIMES}
            index={draft.timeIndex}
            onPick={(timeIndex) => onChange({ ...draft, timeIndex })}
            wrap={panel}
          />
        </Field>

        {/*
          ⚠ Бірінші нұсқа әрқашан «Мақсатсыз». Күнтізбеге жазылған бір
          реттік жоспар автоматты түрде жылдық мақсатқа кірмеуі керек:
          әйтпесе жай ғана шаруа жылдық пайызды жылжытып жібереді.
        */}
        <Field label={kk.calendar.whichGoal}>
          <Options
            items={[kk.calendar.noGoal, ...goals.map((g) => g.title)]}
            index={draft.goalIndex}
            onPick={(goalIndex) => onChange({ ...draft, goalIndex })}
            wrap
            pill
          />
          <Text style={styles.noGoals}>
            {draft.goalIndex === 0 ? kk.calendar.noGoalHint : kk.calendar.inGoalHint}
          </Text>
        </Field>

        <Field label={kk.calendar.repeat}>
          <Options
            items={REPEATS}
            index={draft.repeatIndex}
            onPick={(repeatIndex) => onChange({ ...draft, repeatIndex })}
          />
        </Field>
      </ScrollView>

      <Pressable onPress={onSubmit} style={styles.submit} accessibilityRole="button">
        <Text style={styles.submitText}>
          {date.getDate()} {kk.common.add.toLowerCase()}
        </Text>
      </Pressable>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 15 }}>
      <SectionLabel style={{ marginBottom: 8 }}>{label}</SectionLabel>
      {children}
    </View>
  );
}

function Options({
  items,
  index,
  onPick,
  wrap = false,
  pill = false,
}: {
  items: string[];
  index: number;
  onPick: (i: number) => void;
  wrap?: boolean;
  pill?: boolean;
}) {
  return (
    <View style={[styles.options, wrap && { flexWrap: 'wrap' }]}>
      {items.map((n, i) => {
        const on = i === index;
        return (
          <Pressable
            key={n}
            onPress={() => onPick(i)}
            style={[
              styles.option,
              wrap ? styles.optionAuto : styles.optionFlex,
              {
                borderRadius: pill ? R.pill : R.sm,
                backgroundColor: on ? C.accent : C.cardSoft,
                borderColor: on ? C.accent : C.line,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.optionText, { color: on ? '#FFFFFF' : C.darkInk3 }]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flexGrow: 1,
    backgroundColor: C.card,
    borderTopLeftRadius: R.sheet,
    borderTopRightRadius: R.sheet,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    shadowColor: '#14142D',
    shadowOpacity: 0.1,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: -10 },
    elevation: 12,
  },
  panel: {
    height: '100%',
    backgroundColor: C.card,
    borderRadius: R.card,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#14142D',
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.lineSwitch,
    alignSelf: 'center',
    marginBottom: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headTitle: { fontFamily: font.bold, fontSize: 15, color: C.ink, letterSpacing: -0.3 },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: R.pill,
    backgroundColor: C.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 13,
    backgroundColor: C.tintSoft,
    borderWidth: 1,
    borderColor: C.tintLine,
    borderRadius: R.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateBadge: {
    width: 36,
    height: 36,
    borderRadius: R.sm,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateNum: { fontFamily: font.bold, fontSize: 14, color: '#FFFFFF' },
  dateLong: { fontFamily: font.bold, fontSize: 12.5, color: C.ink },
  dateHint: { fontFamily: font.body, fontSize: 10, color: C.inkSoft, marginTop: 2 },
  input: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: R.input,
    backgroundColor: C.cardSoft,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontFamily: font.body,
    fontSize: 13.5,
    color: C.ink,
  },
  options: { flexDirection: 'row', gap: 6 },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingVertical: 10,
  },
  optionFlex: { flexGrow: 1, flexBasis: 0 },
  optionAuto: { paddingHorizontal: 13 },
  optionText: { fontFamily: font.bold, fontSize: 11.5 },
  noGoals: { fontFamily: font.prose, fontSize: 11.5, lineHeight: 17, color: C.ink4, marginTop: 9 },
  submit: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: R.cardXs,
    backgroundColor: C.accent,
    marginTop: 16,
    shadowColor: C.accent,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  submitText: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },
});
