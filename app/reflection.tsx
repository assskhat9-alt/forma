/**
 * РЕФЛЕКСИЯ — design/Refleksiya.dc.html.
 *
 * Тапсырма орындалған сәтте ашылады. Ең маңыздысы — «Бұл қай мақсаттарды
 * жылжытты» блогы (CLAUDE.md §7.4): бір белгі каскадта қалай тарайтынын
 * көрсетеді. Жеңілдетуге болмайды.
 *
 * §7.5 бойынша «Қанша уақыт кетті?» чиптері де бар — таймерді ұмытып
 * кетсе де фокус деректері жиналуы үшін. Макетте ол өріс жоқ еді.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { color as C, radius as R, font, centered } from '../theme/tokens';
import { kk, t as tpl } from '../i18n/kk';
import { useGoals } from '../lib/goals';
import {
  useImpact, useCreateReflection, useTaskFocusMinutes,
  DURATION_MINUTES, humanMinutes, nowTime,
} from '../lib/reflections';
import { errorText } from '../lib/errors';
import { goBack } from '../lib/nav';
import { SectionLabel } from '../components/ui';
import { CheckIcon } from '../components/icons';
import { KeyboardFrame } from '../components/layout/KeyboardFrame';

export default function ReflectionScreen() {
  const insets = useSafeAreaInsets();
  const { taskId, minutes } = useLocalSearchParams<{
    taskId: string;
    /** Фокус таймері өлшеген уақыт — болса, қайта сұралмайды */
    minutes?: string;
  }>();

  /** Жаңа ғана аяқталған отырыс — сілтемедегі сан */
  const passed = (() => {
    const n = Number(minutes);
    return Number.isFinite(n) && n >= 1 ? Math.round(n) : 0;
  })();

  const { data: goals } = useGoals();
  const task = (goals ?? []).find((g) => g.id === taskId) ?? null;

  const { data: impact, isLoading } = useImpact(taskId ?? null);
  const create = useCreateReflection();

  // Базадағы қосынды жазба әлі жетпей қалуы мүмкін — сондықтан үлкенін аламыз
  const { data: logged } = useTaskFocusMinutes(taskId ?? null);
  const timerMinutes = Math.max(logged ?? 0, passed) || null;

  const [mood, setMood] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => goBack('/');

  const save = () => {
    if (!task) return close();
    setError(null);

    create.mutate(
      {
        goalId: task.id,
        body: body.trim() || null,
        rating: mood != null ? mood + 1 : null,
        // Таймер өлшеген уақыт болса — сол жазылады, чиптер сұралмайды
        minutesSpent:
          timerMinutes ?? (duration != null ? DURATION_MINUTES[duration] ?? null : null),
      },
      { onSuccess: close, onError: (e) => setError(errorText(e)) },
    );
  };

  const completedAt = task?.completed_at ? new Date(task.completed_at) : new Date();

  return (
    // ⚠ Ой жазатын өріс парақтың төменгі жағында — пернетақта оны жабады
    <KeyboardFrame>
    <View style={styles.root}>
      {/* Артқы фонды басу — жабады */}
      <Pressable style={styles.backdrop} onPress={close} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          // ⚠ Сан пернетақтасында «Дайын» түймесі жоқ — тізімді сүйреп жабады
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Растау */}
          <View style={styles.confirm}>
            <View style={styles.check}>
              <CheckIcon size={22} color="#FFFFFF" strokeWidth={3.2} />
            </View>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={styles.doneAt}>
                {tpl(kk.reflection.doneAt, { time: nowTime(completedAt) })}
              </Text>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {task?.title ?? ''}
              </Text>
            </View>
          </View>

          {/* ⚠ §7.4 — каскадтық әсер. Қосымшаның ең мотивациялық тұсы. */}
          <View style={styles.impact}>
            <SectionLabel style={{ color: C.accentDeep, marginBottom: 12 }}>
              {kk.reflection.impact}
            </SectionLabel>

            {isLoading ? (
              <ActivityIndicator color={C.accent} />
            ) : (impact ?? []).length === 0 ? (
              <Text style={styles.impactEmpty}>Есептейтін дерек жоқ.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {(impact ?? []).map((row) => (
                  <View key={row.label} style={styles.impactRow}>
                    <Text style={styles.impactName} numberOfLines={1}>
                      {row.label}
                    </Text>

                    <View style={styles.impactTrack}>
                      {/* Бұрынғы бөлігі — солғын */}
                      <View style={[styles.impactBefore, { width: `${row.from}%` }]} />
                      {/* Дәл осы әрекеттің үлесі — қанық */}
                      <View
                        style={[
                          styles.impactGain,
                          { left: `${row.from}%`, width: `${row.gain}%` },
                        ]}
                      />
                    </View>

                    <Text style={styles.impactTo}>{row.to}%</Text>
                    <Text style={styles.impactGainText}>+{row.gain}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Қалай өтті */}
          <SectionLabel style={styles.label}>{kk.reflection.howWasIt}</SectionLabel>
          <View style={styles.chips}>
            {kk.reflection.moods.map((name, i) => {
              const on = mood === i;
              return (
                <Pressable
                  key={name}
                  onPress={() => setMood(on ? null : i)}
                  style={[styles.mood, on && styles.moodOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.moodText, on && { color: '#FFFFFF' }]}>{name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/*
            Таймермен істелсе — уақыт өлшеніп қойған, оны қайта сұрау артық.
            Чиптер тек таймерсіз орындалған әрекетке шығады (§7.5).
          */}
          <SectionLabel style={styles.label}>{kk.reflection.howLong}</SectionLabel>

          {timerMinutes != null ? (
            <View style={styles.measured}>
              <View style={styles.measuredDot} />
              <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                <Text style={styles.measuredValue}>{humanMinutes(timerMinutes)}</Text>
                <Text style={styles.measuredNote}>{kk.reflection.fromTimer}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.chips}>
              {kk.reflection.durations.map((name, i) => {
                const on = duration === i;
                return (
                  <Pressable
                    key={name}
                    onPress={() => setDuration(on ? null : i)}
                    style={[styles.chip, on && styles.chipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipText, on && { color: '#FFFFFF' }]}>{name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Коментарий */}
          <SectionLabel style={styles.label}>{kk.reflection.comment}</SectionLabel>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={kk.reflection.commentPlaceholder}
            placeholderTextColor={C.ink4}
            multiline
            textAlignVertical="top"
            style={styles.textarea}
          />

          <View style={styles.tags}>
            {kk.reflection.quickTags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() =>
                  setBody((prev) => (prev ? `${prev.trimEnd()} ${tag}.` : `${tag}.`))
                }
                style={styles.tag}
                accessibilityRole="button"
              >
                <Text style={styles.tagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        {/* Әрекеттер */}
        <View style={styles.actions}>
          <Pressable onPress={close} style={styles.later} accessibilityRole="button">
            <Text style={styles.laterText}>{kk.reflection.later}</Text>
          </Pressable>

          <Pressable
            onPress={save}
            disabled={create.isPending}
            style={[styles.save, create.isPending && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            {create.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>{kk.reflection.save}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
    </KeyboardFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,20,32,0.42)' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  sheet: {
    ...centered,
    maxHeight: '92%',
    backgroundColor: C.card,
    borderTopLeftRadius: R.sheetLg,
    borderTopRightRadius: R.sheetLg,
    paddingHorizontal: 22,
    paddingTop: 12,
    shadowColor: '#14142D',
    shadowOpacity: 0.22,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: -12 },
    elevation: 16,
  },
  grabber: {
    width: 38, height: 4, borderRadius: R.pill,
    backgroundColor: C.lineSwitch, alignSelf: 'center', marginBottom: 16,
  },
  scroll: { paddingBottom: 8 },

  confirm: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  check: {
    width: 46, height: 46, borderRadius: R.pill, flexShrink: 0,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  doneAt: {
    fontFamily: font.bold, fontSize: 10, letterSpacing: 1.2,
    textTransform: 'uppercase', color: C.accentDeep,
  },
  taskTitle: {
    fontFamily: font.bold, fontSize: 16, letterSpacing: -0.32,
    color: C.ink, marginTop: 3,
  },

  impact: {
    backgroundColor: C.tintSoft,
    borderWidth: 1, borderColor: C.tintLine,
    borderRadius: R.cardSm,
    paddingHorizontal: 16, paddingVertical: 15,
    marginTop: 16,
  },
  impactEmpty: { fontFamily: font.prose, fontSize: 12, color: C.ink4 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  impactName: {
    fontFamily: font.title, fontSize: 11.5, color: C.inkBody,
    width: 82, flexShrink: 0,
  },
  impactTrack: {
    flexGrow: 1, flexShrink: 1, height: 7, borderRadius: R.pill,
    backgroundColor: C.tintImpact, overflow: 'hidden',
  },
  impactBefore: {
    position: 'absolute', left: 0, top: 0, height: 7,
    borderRadius: R.pill, backgroundColor: C.accentSoft,
  },
  impactGain: { position: 'absolute', top: 0, height: 7, backgroundColor: C.accent },
  impactTo: {
    fontFamily: font.bold, fontSize: 11.5, color: C.ink,
    width: 38, textAlign: 'right', flexShrink: 0,
  },
  impactGainText: {
    fontFamily: font.bold, fontSize: 10.5, color: C.accentDeep,
    width: 32, textAlign: 'right', flexShrink: 0,
  },

  label: { marginTop: 18, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  mood: {
    flexGrow: 1, flexBasis: 0, alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 4, borderRadius: R.chip,
    backgroundColor: C.cardSoft, borderWidth: 1.5, borderColor: C.line,
  },
  moodOn: { backgroundColor: C.accent, borderColor: C.accent },
  moodText: { fontFamily: font.bold, fontSize: 11.5, color: C.darkInk3 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: R.sm,
    backgroundColor: C.cardSoft, borderWidth: 1.5, borderColor: C.line,
  },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontFamily: font.bold, fontSize: 11.5, color: C.darkInk3 },

  /** Таймер өлшеген уақыт — таңдау емес, факт. Сондықтан чип емес, жол. */
  measured: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: C.tintSoft, borderWidth: 1.5, borderColor: C.tintLine,
    borderRadius: R.cardXs, paddingHorizontal: 14, paddingVertical: 12,
  },
  measuredDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: C.accent },
  measuredValue: {
    fontFamily: font.bold, fontSize: 16, letterSpacing: -0.32, color: C.ink,
  },
  measuredNote: {
    fontFamily: font.prose, fontSize: 11.5, color: C.inkMuted, marginTop: 3,
  },

  textarea: {
    minHeight: 92,
    borderWidth: 1.5, borderColor: C.line, borderRadius: R.cardXs,
    backgroundColor: C.cardSoft, paddingHorizontal: 15, paddingVertical: 14,
    fontFamily: font.prose, fontSize: 13, lineHeight: 20, color: C.ink,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  tag: {
    backgroundColor: C.tint, borderRadius: R.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tagText: { fontFamily: font.title, fontSize: 10.5, color: C.accentDeep },

  error: {
    fontFamily: font.title, fontSize: 12, color: C.ink,
    backgroundColor: C.trackChip, borderRadius: R.sm,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 14,
  },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  later: {
    paddingHorizontal: 20, paddingVertical: 15, borderRadius: R.field,
    backgroundColor: C.lineSoft,
  },
  laterText: { fontFamily: font.bold, fontSize: 13, color: C.darkInk3 },
  save: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: R.field, backgroundColor: C.accent,
    shadowColor: C.accent, shadowOpacity: 0.32, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  saveText: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },
});
