/**
 * АЙ — апталар тізімі.
 *
 * Апталарды ЖҮЙЕ ашады: бетке кіргенде `sync_weeks()` шақырылады да,
 * мақсат терезесіне түсетін апталар пайда болады. Пайдаланушы аптаны
 * құрмайды — тек ішіне ӘРЕКЕТ қосады.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../../i18n/kk';
import {
  useGoals, useWeeks, useActions, useNodeStats, useChildrenStats,
  useCreateAction, useToggleTask, useDeleteAction,
} from '../../lib/goals';
import { errorText } from '../../lib/errors';
import { Card, SectionLabel, ProgressBar, Checkbox } from '../../components/ui';
import { ChevronLeftIcon, PlusIcon, CloseIcon } from '../../components/icons';
import { ActionForm, TIMES, REPEATS, type ActionDraft } from '../../components/month/ActionForm';

export default function MonthScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useMemo(() => new Date(), []);

  const { data: goals, isLoading } = useGoals();
  const month = (goals ?? []).find((g) => g.id === id) ?? null;

  const { weeks, isSyncing } = useWeeks(month?.id ?? null);
  const { data: stats } = useNodeStats(month?.id ?? null, today);
  const { data: weekStats } = useChildrenStats(weeks, today);

  const createAction = useCreateAction();
  const toggle = useToggleTask();
  const remove = useDeleteAction();

  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || isSyncing) {
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{kk.signIn.back}</Text>
        </Pressable>
      </View>
    );
  }

  const openForm = (weekId: string, weekStart: string) => {
    setError(null);
    setOpenWeek(weekId);
    setDraft({
      title: '',
      date: new Date(weekStart + 'T00:00:00'),
      timeIndex: TIMES.length - 1, // әдепкіде «уақытсыз»
      repeatIndex: 0, // әдепкіде «бір рет»
    });
  };

  const submit = () => {
    if (!draft || !openWeek) return;
    const title = draft.title.trim();
    if (!title) return setError('Әрекеттің атауын жазыңыз.');

    createAction.mutate(
      {
        parentId: openWeek,
        title,
        date: draft.date,
        time: TIMES[draft.timeIndex] ?? null,
        repeatWeeks: REPEATS[draft.repeatIndex] ?? 1,
      },
      {
        onSuccess: () => { setDraft(null); setOpenWeek(null); },
        onError: (e) => setError(errorText(e)),
      },
    );
  };

  const statOf = (wid: string) => (weekStats ?? []).find((s) => s.goal.id === wid);

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
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
            <ChevronLeftIcon size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>{month.title.toUpperCase()}</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.body}>
          <Card style={styles.summary}>
            <SectionLabel>{month.title}</SectionLabel>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryPct}>
                {(stats?.total ?? 0) > 0 ? `${stats?.actual ?? 0}%` : '—'}
              </Text>
              <Text style={styles.summarySub}>
                {(stats?.total ?? 0) > 0
                  ? tpl(kk.goal.actionCount, { done: stats?.done ?? 0, total: stats?.total ?? 0 })
                  : kk.goal.noActions}
              </Text>
            </View>
            <Text style={styles.summaryRange}>
              {formatDayMonth(new Date(month.period_start + 'T00:00:00'))} —{' '}
              {formatDayMonth(new Date(month.period_end + 'T00:00:00'))}
            </Text>
            {(stats?.total ?? 0) > 0 && (
              <ProgressBar pct={stats?.actual ?? 0} height={6} style={{ marginTop: 12 }} />
            )}
          </Card>

          <SectionLabel style={{ paddingLeft: 4, marginTop: 4 }}>{kk.month.weeks}</SectionLabel>

          {weeks.map((w) => (
            <WeekCard
              key={w.id}
              weekId={w.id}
              title={w.title}
              from={w.period_start}
              to={w.period_end}
              pct={statOf(w.id)?.actual ?? 0}
              total={statOf(w.id)?.total ?? 0}
              done={statOf(w.id)?.done ?? 0}
              onAdd={() => openForm(w.id, w.period_start)}
              onToggle={(actionId, done) => {
                toggle.mutate({ id: actionId, done });
                // §7.4: орындалғанда каскадтық әсер көрсетіледі
                if (done) router.push(`/reflection?taskId=${actionId}` as never);
              }}
              onRemove={(actionId) => remove.mutate(actionId)}
            />
          ))}
        </View>
      </ScrollView>

      {draft && openWeek && (
        <ActionForm
          visible
          min={new Date((weeks.find((w) => w.id === openWeek)?.period_start ?? month.period_start) + 'T00:00:00')}
          max={new Date((weeks.find((w) => w.id === openWeek)?.period_end ?? month.period_end) + 'T00:00:00')}
          draft={draft}
          busy={createAction.isPending}
          error={error}
          onChange={setDraft}
          onClose={() => { setDraft(null); setOpenWeek(null); }}
          onSubmit={submit}
        />
      )}
    </>
  );
}

function WeekCard({
  weekId, title, from, to, pct, total, done, onAdd, onToggle, onRemove,
}: {
  weekId: string;
  title: string;
  from: string;
  to: string;
  pct: number;
  total: number;
  done: number;
  onAdd: () => void;
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const actions = useActions(weekId);

  return (
    <Card level="cardSm" radius={R.cardSm} style={styles.weekCard}>
      <View style={styles.weekHead}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Text style={styles.weekTitle}>{title}</Text>
          <Text style={styles.weekRange}>
            {tpl(kk.month.weekRange, {
              from: formatDayMonth(new Date(from + 'T00:00:00')),
              to: formatDayMonth(new Date(to + 'T00:00:00')),
            })}
          </Text>
        </View>
        {total > 0 && (
          <Text style={styles.weekCount}>{tpl(kk.goal.actionCount, { done, total })}</Text>
        )}
      </View>

      {total > 0 && <ProgressBar pct={pct} height={4} style={{ marginTop: 10 }} />}

      {actions.length === 0 ? (
        <Text style={styles.empty}>{kk.month.empty}</Text>
      ) : (
        <View style={styles.actions}>
          {actions.map((a) => (
            <View key={a.id} style={styles.actionRow}>
              <Checkbox
                checked={a.status === 'done'}
                onToggle={() => onToggle(a.id, a.status !== 'done')}
                size={19}
                radius={6}
              />
              <Text
                style={[styles.actionTitle, a.status === 'done' && styles.actionDone]}
                numberOfLines={2}
              >
                {a.title}
              </Text>
              <Text style={styles.actionDate}>
                {formatDayMonth(new Date(a.period_start + 'T00:00:00'))}
              </Text>
              <Pressable onPress={() => onRemove(a.id)} hitSlop={10} accessibilityRole="button">
                <CloseIcon size={11} color={C.ink4} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={onAdd} style={styles.addBtn} accessibilityRole="button">
        <PlusIcon size={13} color={C.accentDeep} strokeWidth={2.8} />
        <Text style={styles.addText}>{kk.goal.addAction}</Text>
      </Pressable>
    </Card>
  );
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

  weekCard: { paddingHorizontal: 15, paddingVertical: 14 },
  weekHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekTitle: { fontFamily: font.title, fontSize: 13.5, color: C.ink },
  weekRange: { fontFamily: font.body, fontSize: 10.5, color: C.inkMuted, marginTop: 3 },
  weekCount: { fontFamily: font.bold, fontSize: 11, color: C.accent, flexShrink: 0 },

  empty: { fontFamily: font.prose, fontSize: 11.5, color: C.ink4, marginTop: 11 },
  actions: { marginTop: 10 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.lineSoft,
  },
  actionTitle: { fontFamily: font.body, fontSize: 12.5, color: C.ink, flexGrow: 1, flexShrink: 1 },
  actionDone: { color: C.inkFaint, textDecorationLine: 'line-through' },
  actionDate: { fontFamily: font.title, fontSize: 10, color: C.ink4, flexShrink: 0 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 12, paddingVertical: 11, borderRadius: R.sm, backgroundColor: C.tintRow,
  },
  addText: { fontFamily: font.bold, fontSize: 12, color: C.accentDeep },
});
