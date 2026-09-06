/**
 * МАҚСАТ — айлар тізімі.
 *
 * Айларды ЖҮЙЕ ашқан (`sync_months()` триггері). Пайдаланушы оларды
 * құрмайды, ат қоймайды, күн таңдамайды. Бос ай да тізімде тұрады —
 * ішіне кіріп әрекет қосуға болады.
 *
 * ⚠ Пайыз әрекет САНЫМЕН есептеледі, салмақ жоқ. Көп әрекет тұрған ай
 * үлесті өзі көп алады.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { differenceInCalendarDays } from 'date-fns';

import { color as C, radius as R, font, gutter, centered } from '../../../theme/tokens';
import { kk, t as tpl } from '../../../i18n/kk';
import {
  useGoals, useMonths, useNodeStats, useChildrenStats, useDeleteGoal,
} from '../../../lib/goals';
import { goBack } from '../../../lib/nav';
import { SectionLabel } from '../../../components/ui';
import {
  TrashIcon,
  ChevronLeftIcon,
} from '../../../components/icons';
import { GoalHero } from '../../../components/goals/GoalHero';
import { MonthItemCard } from '../../../components/goals/MonthItemCard';
import { GoalActions } from '../../../components/goals/GoalActions';

export default function GoalDetail() {
  const deleteGoal = useDeleteGoal();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useMemo(() => new Date(), []);

  const { data: goals, isLoading } = useGoals();
  const goal = (goals ?? []).find((g) => g.id === id) ?? null;

  const months = useMonths(goal?.id ?? null);
  const { data: stats } = useNodeStats(goal?.id ?? null, today);
  const { data: monthStats } = useChildrenStats(months, today);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Мақсат табылмады.</Text>
        <Pressable onPress={() => goBack('/goals')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{kk.signIn.back}</Text>
        </Pressable>
      </View>
    );
  }

  const due = new Date(goal.period_end + 'T00:00:00');
  const daysLeft = Math.max(differenceInCalendarDays(due, today), 0);
  const actual = stats?.actual ?? 0;
  const planned = stats?.planned ?? 0;
  const gap = stats?.gap ?? 0;
  const hasActions = (stats?.total ?? 0) > 0;

  /** Мерзімнен тыс қалып қойған айлар — әрекеттері бар болғандықтан сақталған */
  const orphans = months.filter(
    (m) => m.period_end < goal.period_start || m.period_start > goal.period_end,
  );

  const statOf = (mid: string) => (monthStats ?? []).find((s) => s.goal.id === mid);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...centered,
        paddingTop: insets.top + 18,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      // ⚠ Сан пернетақтасында «Дайын» түймесі жоқ — тізімді сүйреп жабады
      keyboardDismissMode="on-drag"
    >
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/goals')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.goal.title}</Text>
        <Pressable
          onPress={() => {
            if (confirmDelete) {
              deleteGoal.mutate(goal.id, {
                onSuccess: () => goBack('/goals'),
              });
            } else {
              setConfirmDelete(true);
            }
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={confirmDelete ? kk.goal.deleteConfirm : kk.goal.delete}
        >
          <TrashIcon size={18} color={confirmDelete ? C.accent : C.ink4} />
        </Pressable>
      </View>

      {confirmDelete && (
        <View style={styles.confirmBanner}>
          <Text style={styles.confirmBannerText}>
            {tpl(kk.goal.deletePrompt, { title: goal.title })}
          </Text>
          <View style={styles.confirmBannerBtns}>
            <Pressable
              onPress={() => {
                deleteGoal.mutate(goal.id, {
                  onSuccess: () => goBack('/goals'),
                });
              }}
              disabled={deleteGoal.isPending}
              style={styles.confirmBannerDeleteBtn}
              accessibilityRole="button"
              accessibilityLabel={kk.goal.delete}
            >
              {deleteGoal.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <TrashIcon size={14} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.confirmBannerDeleteText}>{kk.goal.deleteShort}</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => setConfirmDelete(false)}
              style={styles.confirmBannerCancelBtn}
              accessibilityRole="button"
            >
              <Text style={styles.confirmBannerCancelText}>{kk.goal.cancel}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.body}>
        {/* hero */}
        <GoalHero
          goal={goal}
          actual={actual}
          planned={planned}
          gap={gap}
          hasActions={hasActions}
          due={due}
          daysLeft={daysLeft}
        />

        {/* мерзімнен тыс қалған айлар */}
        {orphans.length > 0 && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              {tpl(kk.goal.orphanWarning, { n: orphans.length })}
            </Text>
          </View>
        )}

        {/* АЙЛАР — жүйе ашқан қаңқа */}
        <SectionLabel style={{ paddingLeft: 4, marginTop: 4 }}>{kk.goal.months}</SectionLabel>

        {months.map((m) => (
          <MonthItemCard
            key={m.id}
            m={m}
            stat={statOf(m.id)}
            today={today}
          />
        ))}
        <GoalActions
          goal={goal}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
        />
      </View>
    </ScrollView>
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
  headerTitle: { fontFamily: font.display, fontSize: 12, letterSpacing: 1.92, color: C.ink },
  body: { paddingHorizontal: gutter, gap: 10 },

  confirmBanner: {
    marginHorizontal: gutter,
    marginBottom: 12,
    padding: 14,
    borderRadius: R.sm,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.lineField,
    gap: 10,
  },
  confirmBannerText: {
    fontFamily: font.body,
    fontSize: 13,
    color: C.ink,
    lineHeight: 18,
  },
  confirmBannerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmBannerDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.tiny,
    backgroundColor: C.accent,
  },
  confirmBannerDeleteText: {
    fontFamily: font.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  confirmBannerCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.tiny,
    backgroundColor: C.trackChip,
  },
  confirmBannerCancelText: {
    fontFamily: font.bold,
    fontSize: 12,
    color: C.ink2,
  },

  warning: {
    backgroundColor: C.trackChip, borderRadius: R.sm,
    paddingHorizontal: 13, paddingVertical: 11,
  },
  warningText: { fontFamily: font.title, fontSize: 12, lineHeight: 18, color: C.ink2 },
});
