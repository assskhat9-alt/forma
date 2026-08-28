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
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

import { color as C, radius as R, font, centered } from '../theme/tokens';
import { kk, t as tpl } from '../i18n/kk';
import { useGoals, useDayTasks, useToggleTask, useRootGoals } from '../lib/goals';
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

  const [, tick] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [completing, setCompleting] = useState(false);
  /**
   * Жабу екі рет басуды талап етеді.
   *
   * ⚠ Бұрын карточканың ішінде толық енді «Орындалды» түймесі тұрған да,
   * тапсырманы ТАҢДАУ мен ЖАБУ шатасатын: бір басқанда тапсырма бітті
   * болып кететін. Таңдағаннан кейінгі келесі қадам — уақыт қою, жабу емес.
   */
  const [confirmDone, setConfirmDone] = useState(false);

  // Бүгінгі әрекеттер — таймердің ішінен таңдау үшін
  const { tasks: todayTasks } = useDayTasks(new Date());
  const rootGoals = useRootGoals();
  const pending = todayTasks.filter((t) => !t.done);
  const toggle = useToggleTask();

  /**
   * ⚠ Уақыт күйде САҚТАЛМАЙДЫ — әр рендерде `Date.now()` арқылы
   * есептеледі. Бұрын сақталатын: кідірткенде интервал тоқтап, ескі
   * мән қатып қалатын да, қайта қосқанда есеп теріс шығып, таймер
   * нөлденгендей көрінетін.
   *
   * Интервал енді тек қайта сызуға түрткі болады.
   */
  useEffect(() => {
    if (!store.running) return;
    const t = setInterval(() => tick((x) => x + 1), 250);
    return () => clearInterval(t);
  }, [store.running]);

  // Экранға тапсырмамен келсе — таймерді соған байлаймыз
  useEffect(() => {
    if (task) store.attach(task.id, task.title);
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Тапсырма ауысса растау күйі де тазарады
  useEffect(() => setConfirmDone(false), [store.taskId]);

  const totalMs = store.presetMinutes * 60_000;
  const elapsed = store.elapsedMs(Date.now());
  // ⚠ Белгіленген уақыттан асып кетсе таймер ТОҚТАМАЙДЫ — артығы
  // бөлек саналады. Шектеу қоюдың мәні жоқ: жұмыс ұзаққа кетуі мүмкін.
  const over = elapsed > totalMs;
  const left = over ? elapsed - totalMs : totalMs - elapsed;
  const pct = totalMs > 0 ? Math.min(Math.round((elapsed / totalMs) * 100), 100) : 0;
  const canReset = elapsed > 0 || store.running;

  const r = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * r;

  /** Байланған тапсырманың тамырдағы мақсаты */
  const attached = (() => {
    if (!store.taskId) return null;
    const byId = new Map((goals ?? []).map((g) => [g.id, g]));
    let cur = byId.get(store.taskId);
    const seen = new Set<string>();
    while (cur?.parent_id && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_id);
    }
    // Тамыры өзі болса — бұл жеке шаруа, мақсаты жоқ
    if (!cur || cur.id === store.taskId) return null;
    return { id: cur.id, title: cur.title };
  })();

  const attachedGoal = attached?.title ?? null;

  /**
   * Сақина мақсаттың түсімен айналады.
   *
   * ⚠ Таймер бос айналып тұрмауы керек: сақина мен ішіндегі жазу дәл
   * қай әрекетке тиесілі екенін көрсетеді. Мақсатсыз шаруада — бейтарап түс.
   */
  const ringColor =
    (attached && rootGoals.find((g) => g.id === attached.id)?.color) || C.accent;

  /**
   * Әрекетті ОСЫ ЖЕРДЕ жабу.
   *
   * Күнтізбедегі кезегін күтудің қажеті жоқ: бос уақыт шыға қалса
   * істеп, осында белгілей саласыз. Жиналған уақыт болса ол да
   * сессия ретінде жазылады, сосын рефлексия ашылады.
   */
  const complete = async () => {
    const id = store.taskId;
    if (!id) return;
    setCompleting(true);

    const minutes = Math.round(store.elapsedMs(Date.now()) / 60_000);
    if (minutes >= 1) {
      try {
        await save.mutateAsync({
          goalId: id,
          minutes,
          startedAt: store.sessionStart,
        });
      } catch (e) {
        setNote(errorText(e));
      }
    }

    toggle.mutate({ id, done: true });
    store.reset();
    store.attach(null, '');
    setCompleting(false);
    // Таймер өлшеген уақыт нәтижеге де жазылсын — қайта сұраудың мәні жоқ
    const q = minutes >= 1 ? `&minutes=${minutes}` : '';
    router.replace(`/reflection?taskId=${id}${q}` as never);
  };

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

        {/*
          Тапсырма таңдалмаса — бүгінгі әрекеттер тізімі шығады.
          Бос уақыт шыға қалса, күнтізбедегі кезегін күтпей-ақ біреуін
          алып, осы жерде істеп, осы жерде жауып тастауға болады.
        */}
        {store.taskId ? (
          // Сол жақтағы жіңішке жолақ сақинаның түсімен — екеуі бір нәрсе
          <View style={[styles.taskCard, { borderLeftWidth: 3, borderLeftColor: ringColor }]}>
            <View style={styles.taskHead}>
              <Text style={styles.lbl}>{kk.focus.current}</Text>
              <Pressable
                onPress={() => store.attach(null, '')}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.change}>{kk.focus.change}</Text>
              </Pressable>
            </View>

            <Text style={styles.taskTitle} numberOfLines={2}>
              {store.taskTitle}
            </Text>

            {attachedGoal && (
              <View style={styles.goalChip}>
                <View style={[styles.goalChipDot, { backgroundColor: ringColor }]} />
                <Text style={styles.goalChipText}>{attachedGoal}</Text>
              </View>
            )}

            {/*
              ⚠ Мұнда АЯҚТАУ түймесі ЖОҚ. Бұрын осында тұрған да, тапсырманы
              таңдау мен аяқтау шатасатын. Таңдағаннан кейінгі қадам — уақыт қою.
            */}
            <Text style={styles.nextStep}>{kk.focus.nextStep}</Text>
          </View>
        ) : (
          <View style={styles.taskCard}>
            <View style={styles.taskHead}>
              <Text style={styles.lbl}>{kk.focus.pickTask}</Text>
              <Text style={styles.pickHint}>{kk.focus.pickHint}</Text>
            </View>

            {pending.length === 0 ? (
              <Text style={styles.pickEmpty}>
                {todayTasks.length === 0 ? kk.focus.noTasksToday : kk.focus.allDoneToday}
              </Text>
            ) : (
              <View style={styles.pickList}>
                {pending.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => store.attach(t.id, t.title)}
                    style={styles.pickRow}
                    accessibilityRole="button"
                  >
                    <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                      <Text style={styles.pickTitle} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text style={styles.pickMeta}>
                        {t.time ?? kk.focus.noTime}
                        {t.goal ? ` · ${t.goal.title}` : ''}
                      </Text>
                    </View>
                    <ChevronRightIcon size={14} color={C.darkInk3} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Сақина */}
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={RING / 2} cy={RING / 2} r={r}
              fill="none" stroke={C.darkCard2} strokeWidth={STROKE}
            />
            <Circle
              cx={RING / 2} cy={RING / 2} r={r}
              fill="none" stroke={ringColor} strokeWidth={STROKE} strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>

          <View style={styles.ringCenter} pointerEvents="none">
            {/*
              Сақинаның ішінде тапсырманың аты тұрады — таймер жалпы
              уақыт емес, ДӘЛ ОСЫ әрекеттің уақытын санап тұрғаны көрінсін.
            */}
            <Text
              style={[styles.ringTask, !store.taskId && styles.ringTaskEmpty]}
              numberOfLines={2}
            >
              {store.taskId ? store.taskTitle : kk.focus.noTaskRing}
            </Text>

            <Text style={styles.clock}>
              {over ? '+' : ''}{formatClock(left)}
            </Text>
            <Text style={[styles.state, over && { color: C.accentOnDark }]}>
              {over
                ? kk.focus.overtime
                : store.running
                  ? kk.focus.running
                  : elapsed > 0
                    ? kk.focus.paused
                    : kk.focus.ready}
            </Text>
            <View style={styles.pctRow}>
              <View style={[styles.pctDot, { backgroundColor: ringColor }]} />
              <Text style={styles.pctText}>
                {attachedGoal ? attachedGoal + ' · ' : ''}
                {tpl(kk.focus.passed, { pct })}
              </Text>
            </View>
          </View>
        </View>

        {/* Ұзақтығы — жылдам нұсқалар ШЕКТЕУ ЕМЕС */}
        <View style={styles.durHead}>
          <Text style={styles.lbl}>{kk.focus.duration}</Text>
          <Text style={styles.durFree}>{kk.focus.durationFree}</Text>
        </View>

        <View style={styles.presets}>
          {PRESETS.map((m) => {
            const on = store.presetMinutes === m && !customOpen;
            return (
              <Pressable
                key={m}
                onPress={() => { setCustomOpen(false); store.setPreset(m); }}
                style={[styles.preset, on && styles.presetOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.presetText, on && { color: '#FFFFFF' }]}>
                  {m} {kk.focus.minutes}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => {
              setCustomOpen(true);
              setCustomText(String(store.presetMinutes));
            }}
            style={[styles.preset, customOpen && styles.presetOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: customOpen }}
          >
            <Text style={[styles.presetText, customOpen && { color: '#FFFFFF' }]}>
              {kk.focus.custom}
            </Text>
          </Pressable>
        </View>

        {customOpen && (
          <View style={styles.customRow}>
            <TextInput
              value={customText}
              onChangeText={(v) => {
                const clean = v.replace(/[^0-9]/g, '').slice(0, 4);
                setCustomText(clean);
                const n = parseInt(clean, 10);
                if (Number.isFinite(n) && n > 0) store.setPreset(n);
              }}
              keyboardType="number-pad"
              inputMode="numeric"
              style={styles.customInput}
              autoFocus
            />
            <Text style={styles.customUnit}>{kk.focus.minutes}</Text>
          </View>
        )}

        {/* Басқару */}
        <View style={styles.controls}>
          <Pressable
            onPress={store.reset}
            disabled={!canReset}
            style={[styles.sideBtn, !canReset && { opacity: 0.35 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.focus.resetHint}
          >
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

          <View style={styles.sideBtnGhost} />
        </View>

        {/*
          Екі әрекет — екеуі де ЖАЗУЫМЕН тұрады, иконкамен емес.
          Біреуі уақытты ғана сақтайды, екіншісі тапсырманы аяқтайды:
          айырмасы көрініп тұруы керек.
        */}
        <View style={styles.actions}>
          <Pressable
            onPress={finish}
            disabled={save.isPending || elapsed < 60_000}
            style={[
              styles.actionBtn,
              (save.isPending || elapsed < 60_000) && { opacity: 0.4 },
            ]}
            accessibilityRole="button"
          >
            {save.isPending ? (
              <ActivityIndicator color={C.darkInk2} size="small" />
            ) : (
              <Text style={styles.actionText}>{kk.focus.saveTime}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => (confirmDone ? void complete() : setConfirmDone(true))}
            disabled={!store.taskId || completing}
            style={[
              styles.actionBtn,
              styles.finishBtn,
              confirmDone && styles.finishBtnOn,
              !store.taskId && { opacity: 0.4 },
            ]}
            accessibilityRole="button"
          >
            {completing ? (
              <ActivityIndicator color={C.accentOnDark} size="small" />
            ) : (
              <>
                <CheckIcon
                  size={13}
                  color={confirmDone ? '#FFFFFF' : C.accentOnDark}
                  strokeWidth={3}
                />
                <Text style={[styles.finishText, confirmDone && { color: '#FFFFFF' }]}>
                  {confirmDone ? kk.focus.finishConfirm : kk.focus.finishTask}
                </Text>
              </>
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
            <Pressable
              onPress={() => router.push('/time' as never)}
              style={styles.reportBtn}
              accessibilityRole="link"
            >
              <Text style={styles.reportText}>{kk.focus.fullReport}</Text>
              <ChevronRightIcon size={11} color={C.accentOnDark} strokeWidth={3} />
            </Pressable>
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

        {attachedGoal && (
          <Text style={styles.footer}>{tpl(kk.focus.savedTo, { goal: attachedGoal })}</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginTop: 9,
    backgroundColor: 'rgba(122,108,240,0.16)', borderRadius: R.pill,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  goalChipDot: { width: 5, height: 5, borderRadius: 999 },
  goalChipText: { fontFamily: font.bold, fontSize: 10, color: C.accentOnDark },

  taskHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  change: { fontFamily: font.bold, fontSize: 11, color: C.accentOnDark },
  pickHint: { fontFamily: font.title, fontSize: 10, color: C.darkInk3 },
  pickEmpty: {
    fontFamily: font.prose, fontSize: 12, color: C.darkInk3, marginTop: 10,
  },
  pickList: { marginTop: 8 },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.darkLine,
  },
  pickTitle: { fontFamily: font.title, fontSize: 13, color: '#FFFFFF' },
  pickMeta: { fontFamily: font.body, fontSize: 10.5, color: C.darkInk3, marginTop: 2 },

  nextStep: {
    fontFamily: font.body, fontSize: 11.5, lineHeight: 17,
    color: C.darkInk2, marginTop: 12,
  },

  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringTask: {
    fontFamily: font.bold, fontSize: 12.5, lineHeight: 17,
    color: '#FFFFFF', textAlign: 'center',
    maxWidth: RING - 96, marginBottom: 6,
  },
  ringTaskEmpty: { fontFamily: font.body, color: C.darkInk3 },
  clock: {
    fontFamily: font.display, fontSize: 44, letterSpacing: -2.2, color: '#FFFFFF',
  },
  state: {
    fontFamily: font.bold, fontSize: 10, letterSpacing: 1.6,
    color: C.darkInk3, marginTop: 7,
  },
  pctRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, maxWidth: RING - 90, paddingHorizontal: 8,
  },
  pctDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: C.accent },
  pctText: { fontFamily: font.title, fontSize: 11, color: C.darkInk2 },

  durHead: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginTop: 22, marginBottom: 10,
  },
  durFree: { fontFamily: font.title, fontSize: 10, color: C.darkInk3 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  customRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    backgroundColor: C.darkCard, borderWidth: 1.5, borderColor: C.accent,
    borderRadius: R.chip, paddingHorizontal: 15, paddingVertical: 8,
  },
  customInput: {
    fontFamily: font.display, fontSize: 22, letterSpacing: -0.66,
    color: '#FFFFFF', minWidth: 60, paddingVertical: 2,
  },
  customUnit: { fontFamily: font.title, fontSize: 12, color: C.darkInk2 },
  preset: {
    flexGrow: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10,
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
  /** Ойық — ойнату түймесі дәл ортада тұруы үшін */
  sideBtnGhost: { width: 52, height: 52 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn: {
    flexGrow: 1, flexShrink: 1, flexBasis: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 46, borderRadius: R.sm,
    backgroundColor: C.darkCard, borderWidth: 1, borderColor: C.darkLine,
  },
  actionText: { fontFamily: font.bold, fontSize: 12.5, color: C.darkInk2 },
  /** Аяқтау — бөлек түс, бірақ ойнату түймесінен басым емес */
  finishBtn: { backgroundColor: 'rgba(122,108,240,0.14)', borderColor: 'rgba(122,108,240,0.35)' },
  finishBtnOn: { backgroundColor: C.accent, borderColor: C.accent },
  finishText: { fontFamily: font.bold, fontSize: 12.5, color: C.accentOnDark },

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
