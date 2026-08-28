/**
 * ФОКУС ТАЙМЕРІ — design/Fokus.dc.html.
 *
 * Жалғыз қара тақырыпты экран. Фон `darkBg0` (#0F0F16) — қалған қара
 * карточкалардан бір саты қою, әдейі солай.
 *
 * Таймер күйі zustand-та: экраннан шықсаңыз да жүріп тұрады.
 * Сессия аяқталғанда `focus_sessions` кестесіне жазылады.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

import { color as C, radius as R, font, centered } from '../theme/tokens';
import { kk, t as tpl } from '../i18n/kk';
import { useGoals } from '../lib/goals';
import {
  useFocusStore, useSaveSession, useTodayFocus,
  PRESETS, formatClock, formatDuration,
} from '../lib/focus';
import { errorText } from '../lib/errors';
import { goBack } from '../lib/nav';
import { CloseIcon, PlayIcon, PauseIcon, ResetIcon, CheckIcon, ChevronRightIcon } from '../components/icons';

const RING = 260;
const STROKE = 14;

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();

  const { data: goals } = useGoals();
  const task = taskId ? (goals ?? []).find((g) => g.id === taskId) ?? null : null;

  const store = useFocusStore();
  const save = useSaveSession();
  const { data: today } = useTodayFocus(new Date());

  const [now, setNow] = useState(Date.now());
  const [note, setNote] = useState<string | null>(null);

  // Таймер жүріп тұрғанда ғана секунд сайын жаңартамыз
  useEffect(() => {
    if (!store.running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [store.running]);

  // Экранға тапсырмамен келсе — таймерді соған байлаймыз
  useEffect(() => {
    if (task) store.attach(task.id, task.title);
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalMs = store.presetMinutes * 60_000;
  const elapsed = Math.min(store.elapsedMs(now), totalMs);
  const left = totalMs - elapsed;
  const pct = totalMs > 0 ? Math.round((elapsed / totalMs) * 100) : 0;

  const r = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * r;

  /** Тамырдағы мақсаттың атауы — «қай мақсатқа жазылады» */
  const rootTitle = (() => {
    if (!task) return null;
    const byId = new Map((goals ?? []).map((g) => [g.id, g]));
    let cur = byId.get(task.id);
    const seen = new Set<string>();
    while (cur?.parent_id && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_id);
    }
    return cur?.title ?? null;
  })();

  const finish = () => {
    const minutes = Math.round(store.elapsedMs(Date.now()) / 60_000);
    if (minutes < 1) {
      setNote(kk.focus.tooShort);
      return;
    }

    save.mutate(
      { goalId: store.taskId, minutes, startedAt: store.sessionStart },
      {
        onSuccess: () => {
          setNote(tpl(kk.focus.saved, { n: minutes }));
          store.reset();
        },
        onError: (e) => setNote(errorText(e)),
      },
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Pressable onPress={() => goBack('/')} style={styles.iconBtn} accessibilityRole="button">
            <CloseIcon size={13} color={C.darkInk2} />
          </Pressable>
          <Text style={styles.headerTitle}>{kk.focus.title}</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Ағымдағы тапсырма */}
        <View style={styles.taskCard}>
          <Text style={styles.lbl}>{kk.focus.current}</Text>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {store.taskTitle || kk.focus.noTask}
          </Text>
          {rootTitle && (
            <View style={styles.goalChip}>
              <Text style={styles.goalChipText}>{rootTitle}</Text>
            </View>
          )}
        </View>

        {/* Сақина */}
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={RING / 2} cy={RING / 2} r={r}
              fill="none" stroke={C.darkCard2} strokeWidth={STROKE}
            />
            <Circle
              cx={RING / 2} cy={RING / 2} r={r}
              fill="none" stroke={C.accent} strokeWidth={STROKE} strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>

          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={styles.clock}>{formatClock(left)}</Text>
            <Text style={styles.state}>
              {store.running ? kk.focus.running : kk.focus.paused}
            </Text>
            <View style={styles.pctRow}>
              <View style={styles.pctDot} />
              <Text style={styles.pctText}>{tpl(kk.focus.passed, { pct })}</Text>
            </View>
          </View>
        </View>

        {/* Ұзақтығы */}
        <Text style={[styles.lbl, { marginTop: 22 }]}>{kk.focus.duration}</Text>
        <View style={styles.presets}>
          {PRESETS.map((m) => {
            const on = store.presetMinutes === m;
            return (
              <Pressable
                key={m}
                onPress={() => store.setPreset(m)}
                style={[styles.preset, on && styles.presetOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.presetText, on && { color: '#FFFFFF' }]}>{m} мин</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Басқару */}
        <View style={styles.controls}>
          <Pressable onPress={store.reset} style={styles.sideBtn} accessibilityRole="button">
            <ResetIcon size={19} color={C.darkInk2} />
          </Pressable>

          <Pressable
            onPress={() => (store.running ? store.pause() : store.start())}
            style={styles.playBtn}
            accessibilityRole="button"
          >
            {store.running ? (
              <PauseIcon size={24} color="#FFFFFF" />
            ) : (
              <PlayIcon size={26} color="#FFFFFF" />
            )}
          </Pressable>

          <Pressable
            onPress={finish}
            disabled={save.isPending}
            style={styles.sideBtn}
            accessibilityRole="button"
          >
            {save.isPending ? (
              <ActivityIndicator color={C.darkInk2} />
            ) : (
              <CheckIcon size={19} color={C.darkInk2} strokeWidth={2.6} />
            )}
          </Pressable>
        </View>

        {note && <Text style={styles.note}>{note}</Text>}

        <View style={{ flexGrow: 1 }} />

        {/* Бүгінгі жиынтық */}
        <View style={styles.totalCard}>
          <View style={styles.totalHead}>
            <View>
              <Text style={styles.lbl}>{kk.focus.todayTotal}</Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalValue}>
                  {formatDuration(today?.total ?? 0)}
                </Text>
                <Text style={styles.totalUnit}>{kk.focus.hours}</Text>
              </View>
            </View>
            <View style={styles.reportBtn}>
              <Text style={styles.reportText}>{kk.focus.fullReport}</Text>
              <ChevronRightIcon size={11} color={C.accentOnDark} strokeWidth={3} />
            </View>
          </View>

          {(today?.byGoal ?? []).length > 0 && (
            <>
              <View style={styles.splitBar}>
                {(today?.byGoal ?? []).map(([label, m], i) => (
                  <View
                    key={label}
                    style={{
                      // flex үлесі — пайызбен жазсақ RN типі қабылдамайды
                      flexGrow: m,
                      flexBasis: 0,
                      backgroundColor: SPLIT[i % SPLIT.length],
                    }}
                  />
                ))}
              </View>

              <View style={styles.legend}>
                {(today?.byGoal ?? []).map(([label, m], i) => (
                  <View key={label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: SPLIT[i % SPLIT.length] }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>{label}</Text>
                    <Text style={styles.legendValue}>{formatDuration(m)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {rootTitle && (
          <Text style={styles.footer}>{tpl(kk.focus.savedTo, { goal: rootTitle })}</Text>
        )}
      </View>
    </View>
  );
}

const SPLIT = [C.accent, C.accent2, C.accent4, C.accent3, C.accentSoft];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.darkBg0 },
  inner: { ...centered, flex: 1, paddingHorizontal: 22 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingBottom: 8,
  },
  iconBtn: {
    width: 30, height: 30, borderRadius: R.pill, backgroundColor: C.darkCard2,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: font.display, fontSize: 12, letterSpacing: 2.16, color: '#FFFFFF',
  },

  lbl: {
    fontFamily: font.bold, fontSize: 10, letterSpacing: 1.2,
    textTransform: 'uppercase', color: C.darkInk3,
  },

  taskCard: {
    backgroundColor: C.darkCard, borderWidth: 1, borderColor: C.darkLine,
    borderRadius: R.cardSm, paddingHorizontal: 16, paddingVertical: 15, marginTop: 10,
  },
  taskTitle: {
    fontFamily: font.bold, fontSize: 15, letterSpacing: -0.3,
    color: '#FFFFFF', marginTop: 7,
  },
  goalChip: {
    alignSelf: 'flex-start', marginTop: 9,
    backgroundColor: 'rgba(122,108,240,0.16)', borderRadius: R.pill,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  goalChipText: { fontFamily: font.bold, fontSize: 10, color: C.accentOnDark },

  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  clock: {
    fontFamily: font.display, fontSize: 46, letterSpacing: -2.3, color: '#FFFFFF',
  },
  state: {
    fontFamily: font.bold, fontSize: 10, letterSpacing: 1.6,
    color: C.darkInk3, marginTop: 9,
  },
  pctRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  pctDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: C.accent },
  pctText: { fontFamily: font.title, fontSize: 11, color: C.darkInk2 },

  presets: { flexDirection: 'row', gap: 7, marginTop: 10 },
  preset: {
    flexGrow: 1, flexBasis: 0, alignItems: 'center', paddingVertical: 12,
    borderRadius: R.chip, backgroundColor: C.darkCard,
    borderWidth: 1.5, borderColor: C.darkLine,
  },
  presetOn: { backgroundColor: C.accent, borderColor: C.accent },
  presetText: { fontFamily: font.bold, fontSize: 12, color: C.darkInk2 },

  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 16, marginTop: 26,
  },
  sideBtn: {
    width: 52, height: 52, borderRadius: R.pill, backgroundColor: C.darkCard,
    borderWidth: 1, borderColor: C.darkLine,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    width: 78, height: 78, borderRadius: R.pill, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  note: {
    fontFamily: font.title, fontSize: 12, color: C.accentOnDark,
    textAlign: 'center', marginTop: 14,
  },

  totalCard: {
    backgroundColor: C.darkCard, borderWidth: 1, borderColor: C.darkLine,
    borderRadius: R.cardSm, paddingHorizontal: 16, paddingVertical: 15,
  },
  totalHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 5 },
  totalValue: { fontFamily: font.display, fontSize: 24, letterSpacing: -0.96, color: '#FFFFFF' },
  totalUnit: { fontFamily: font.title, fontSize: 11, color: C.darkInk3 },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(122,108,240,0.16)', borderRadius: R.pill,
    paddingHorizontal: 13, paddingVertical: 8,
  },
  reportText: { fontFamily: font.bold, fontSize: 10.5, color: C.accentOnDark },

  splitBar: {
    flexDirection: 'row', height: 8, borderRadius: R.pill,
    overflow: 'hidden', marginTop: 15, backgroundColor: C.darkTrack,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 999 },
  legendLabel: { fontFamily: font.title, fontSize: 10, color: C.darkInk2, maxWidth: 110 },
  legendValue: { fontFamily: font.bold, fontSize: 10, color: '#FFFFFF' },

  footer: {
    fontFamily: font.body, fontSize: 10.5, color: C.darkInk3,
    textAlign: 'center', marginTop: 12,
  },
});
