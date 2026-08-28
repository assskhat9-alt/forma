/**
 * АЙ — әрекеттер тізімі.
 *
 * ⚠ Апта енді ҚҰРЫЛЫМ емес. Әрекеттер тікелей айға тіркеледі, ал апта
 * төмендегі жолақта телефондағы «экран уақыты» сияқты СТАТИСТИКА болып
 * қана көрінеді.
 *
 * Күнді таңдағанда «тек осы айға» деген шектеу жоқ: басқа айдың күні
 * таңдалса, әрекет сол айға өзі көшеді.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, formatDayMonth, weekdaysShort, t as tpl } from '../../i18n/kk';
import {
  useGoals, useActions, useNodeStats, useMonthWeekStats,
  useCreateAction, useToggleTask, useDeleteAction,
} from '../../lib/goals';
import { errorText } from '../../lib/errors';
import { goBack } from '../../lib/nav';
import { Card, SectionLabel, ProgressBar, Checkbox, AddButton } from '../../components/ui';
import { ChevronLeftIcon, CloseIcon, ClockIcon } from '../../components/icons';
import { ActionForm, REPEATS, type ActionDraft } from '../../components/month/ActionForm';

export default function MonthScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useMemo(() => new Date(), []);

  const { data: goals, isLoading } = useGoals();
  const month = (goals ?? []).find((g) => g.id === id) ?? null;
  const goal = month ? (goals ?? []).find((g) => g.id === month.parent_id) ?? null : null;

  const actions = useActions(month?.id ?? null);
  const { data: stats } = useNodeStats(month?.id ?? null, today);
  const { data: weeks } = useMonthWeekStats(month?.id ?? null);

  const createAction = useCreateAction();
  const toggle = useToggleTask();
  const remove = useDeleteAction();

  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!month) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Ай табылмады.</Text>
        <Pressable onPress={() => goBack(goal ? `/goal/${goal.id}` : '/goals')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{kk.signIn.back}</Text>
        </Pressable>
      </View>
    );
  }

  const total = stats?.total ?? 0;
  const done = stats?.done ?? 0;

  const openForm = () => {
    setError(null);
    // Айдың басы — бірақ кез келген күнге ауыстыруға болады
    setDraft({
      title: '',
      date: new Date(month.period_start + 'T00:00:00'),
      time: null,
      repeatIndex: 0,
    });
  };

  const submit = () => {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) return setError('Әрекеттің атауын жазыңыз.');

    createAction.mutate(
      {
        monthId: month.id,
        title,
        date: draft.date,
        time: draft.time,
        repeatWeeks: REPEATS[draft.repeatIndex] ?? 1,
      },
      {
        onSuccess: () => setDraft(null),
        onError: (e) => setError(errorText(e)),
      },
    );
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          ...centered,
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => goBack(goal ? `/goal/${goal.id}` : '/goals')} hitSlop={10} accessibilityRole="button">
            <ChevronLeftIcon size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>{month.title.toUpperCase()}</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.body}>
          {/* Қорытынды */}
          <Card style={styles.summary}>
            {goal && <SectionLabel>{goal.title}</SectionLabel>}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryPct}>{total > 0 ? `${stats?.actual ?? 0}%` : '—'}</Text>
              <Text style={styles.summarySub}>
                {total > 0 ? tpl(kk.goal.actionCount, { done, total }) : kk.goal.noActions}
              </Text>
            </View>
            <Text style={styles.summaryRange}>
              {formatDayMonth(new Date(month.period_start + 'T00:00:00'))} —{' '}
              {formatDayMonth(new Date(month.period_end + 'T00:00:00'))}
            </Text>
            {total > 0 && (
              <ProgressBar pct={stats?.actual ?? 0} height={6} style={{ marginTop: 12 }} />
            )}
          </Card>

          {/* ӘРЕКЕТТЕР — негізгі блок */}
          <SectionLabel style={styles.listHead}>{kk.month.actions}</SectionLabel>

          <Card level="cardSm" radius={R.cardSm} style={styles.listCard}>
            {actions.length === 0 ? (
              <Pressable onPress={openForm} style={styles.empty} accessibilityRole="button">
                <Text style={styles.emptyText}>{kk.goal.noActions}</Text>
                <Text style={styles.emptyHint}>{kk.goal.addAction}</Text>
              </Pressable>
            ) : (
              actions.map((a, i) => (
                <View
                  key={a.id}
                  style={[styles.actionRow, i < actions.length - 1 && styles.divider]}
                >
                  <Checkbox
                    checked={a.status === 'done'}
                    onToggle={() => {
                      const next = a.status !== 'done';
                      toggle.mutate({ id: a.id, done: next });
                      if (next) router.push(`/reflection?taskId=${a.id}` as never);
                    }}
                    size={20}
                    radius={6}
                  />

                  <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                    <Text
                      style={[styles.actionTitle, a.status === 'done' && styles.actionDone]}
                      numberOfLines={2}
                    >
                      {a.title}
                    </Text>
                    <View style={styles.actionMeta}>
                      <Text style={styles.actionDate}>
                        {formatDayMonth(new Date(a.period_start + 'T00:00:00'))}
                      </Text>
                      {a.scheduled_at && (
                        <>
                          <ClockIcon size={10} color={C.ink4} strokeWidth={2.6} />
                          <Text style={styles.actionTime}>{timeOf(a.scheduled_at)}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  <Pressable
                    onPress={() => remove.mutate(a.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                  >
                    <CloseIcon size={11} color={C.ink4} />
                  </Pressable>
                </View>
              ))
            )}
          </Card>

          {/* Қосу — әрекеттер тізімінің дәл астында */}
          <AddButton label={kk.goal.addAction} onPress={openForm} />

          {/* АПТАЛАР — тек статистикалық фон */}
          {(weeks ?? []).length > 0 && (
            <>
              <SectionLabel style={{ paddingLeft: 4, marginTop: 6 }}>
                {kk.month.weekStats}
              </SectionLabel>

              <Card level="cardSm" radius={R.cardSm} style={styles.statsCard}>
                <View style={styles.bars}>
                  {(weeks ?? []).map((w) => {
                    // Трек әрқашан бір биіктікте — бос апта да орнында тұрады.
                    // Ішінде: ашық бөлік = барлық әрекет, қанық = орындалғаны.
                    const max = Math.max(...(weeks ?? []).map((x) => x.total), 1);
                    const totalH = (w.total / max) * BAR_H;
                    const doneH = w.total === 0 ? 0 : (w.done / w.total) * totalH;
                    const from = new Date(w.start + 'T00:00:00').getDate();
                    const to = new Date(w.end + 'T00:00:00').getDate();

                    return (
                      <View key={w.start} style={styles.barCol}>
                        <View style={styles.barTrack}>
                          <View style={[styles.barTotal, { height: totalH }]}>
                            <View style={[styles.barDone, { height: doneH }]} />
                          </View>
                        </View>
                        <Text style={styles.barLabel}>
                          {from === to ? from : `${from}–${to}`}
                        </Text>
                        <Text style={[styles.barCount, w.total === 0 && { color: C.ink4 }]}>
                          {w.total === 0 ? '—' : `${w.done}/${w.total}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.statsNote}>
                  Апта — тек көрсеткіш. Әрекеттер айға тіркеледі.
                </Text>
              </Card>
            </>
          )}
        </View>
      </ScrollView>

      {draft && goal && (
        <ActionForm
          visible
          min={new Date(goal.period_start + 'T00:00:00')}
          max={new Date(goal.period_end + 'T00:00:00')}
          draft={draft}
          busy={createAction.isPending}
          error={error}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSubmit={submit}
        />
      )}
    </>
  );
}

/** Апталық бағанның биіктігі */
const BAR_H = 52;

/** `2026-09-01T08:00:00+05` → `08:00` */
function timeOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 12 },
  missing: { fontFamily: font.title, fontSize: 14, color: C.inkMuted },
  backBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: R.sm,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.lineField,
  },
  backBtnText: { fontFamily: font.bold, fontSize: 12.5, color: C.ink },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: { fontFamily: font.display, fontSize: 12, letterSpacing: 1.68, color: C.ink },
  body: { paddingHorizontal: gutter, gap: 10 },

  summary: { padding: 17 },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 6 },
  summaryPct: { fontFamily: font.display, fontSize: 32, letterSpacing: -1.28, color: C.ink },
  summarySub: { fontFamily: font.title, fontSize: 12, color: C.inkMuted },
  summaryRange: { fontFamily: font.body, fontSize: 11, color: C.ink4, marginTop: 4 },

  listHead: { paddingLeft: 4, marginTop: 6 },

  listCard: { paddingHorizontal: 15, paddingVertical: 4 },
  empty: { paddingVertical: 26, alignItems: 'center', gap: 6 },
  emptyText: { fontFamily: font.prose, fontSize: 12.5, color: C.ink4 },
  emptyHint: { fontFamily: font.bold, fontSize: 12, color: C.accentDeep },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  actionTitle: { fontFamily: font.body, fontSize: 12.5, color: C.ink, lineHeight: 18 },
  actionDone: { color: C.inkFaint, textDecorationLine: 'line-through' },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  actionDate: { fontFamily: font.title, fontSize: 10, color: C.inkMuted },
  actionTime: { fontFamily: font.bold, fontSize: 10, color: C.ink4 },

  statsCard: { paddingHorizontal: 15, paddingVertical: 14 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barCol: { flexGrow: 1, flexBasis: 0, alignItems: 'center', gap: 5 },
  barTrack: {
    width: '100%', height: BAR_H, borderRadius: R.micro,
    backgroundColor: C.trackChip, justifyContent: 'flex-end', overflow: 'hidden',
  },
  barTotal: {
    width: '100%', borderRadius: R.micro,
    backgroundColor: C.accentLine, justifyContent: 'flex-end', overflow: 'hidden',
  },
  barDone: { width: '100%', borderRadius: R.micro, backgroundColor: C.accent },
  barLabel: { fontFamily: font.bold, fontSize: 9, color: C.ink4 },
  barCount: { fontFamily: font.bold, fontSize: 9, color: C.inkMuted },
  statsNote: {
    fontFamily: font.prose, fontSize: 10.5, color: C.ink4,
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.lineSoft,
  },
});
