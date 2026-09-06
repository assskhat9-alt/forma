import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDueShort, t as tpl } from '../../i18n/kk';
import {
  useMonths,
  useChildrenStats,
  useDeleteGoal,
  type NodeStats,
} from '../../lib/goals';
import { Card, SectionLabel, ProgressRing, ProgressBar, PaceBadge } from '../ui';
import {
  CalendarChipIcon,
  ChevronRightIcon,
  TrashIcon,
} from '../icons';

export function GoalCard({
  item,
  open,
  onToggle,
  today,
}: {
  item: NodeStats;
  open: boolean;
  onToggle: () => void;
  today: Date;
}) {
  const { goal, color, actual, gap, total, done } = item;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteGoal = useDeleteGoal();

  const months = useMonths(open ? goal.id : null);
  const { data: monthStats } = useChildrenStats(months, today);
  const due = new Date(goal.period_end + 'T00:00:00');
  const hasActions = total > 0;

  const handleDelete = () => {
    deleteGoal.mutate(goal.id, {
      onSuccess: () => setConfirmDelete(false),
    });
  };

  return (
    <Card level="cardSm" radius={R.cardSm} style={styles.goalCard}>
      {confirmDelete ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmPrompt}>
            {tpl(kk.goal.deletePrompt, { title: goal.title })}
          </Text>
          <View style={styles.confirmActions}>
            <Pressable
              onPress={handleDelete}
              disabled={deleteGoal.isPending}
              style={styles.confirmDeleteBtn}
              accessibilityRole="button"
              accessibilityLabel={kk.goal.delete}
            >
              {deleteGoal.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <TrashIcon size={14} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.confirmDeleteBtnText}>{kk.goal.deleteShort}</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => setConfirmDelete(false)}
              style={styles.confirmCancelBtn}
              accessibilityRole="button"
              accessibilityLabel={kk.goal.cancel}
            >
              <Text style={styles.confirmCancelBtnText}>{kk.goal.cancel}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.goalHead}>
            <Pressable onPress={onToggle} style={styles.goalMain} accessibilityRole="button">
              <ProgressRing
                pct={actual}
                size={44}
                strokeWidth={5}
                color={color}
                trackColor={C.tintRing}
                numberSize={11}
                showPercentSign={false}
              />

              <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                <Text style={styles.goalTitle} numberOfLines={2}>
                  {goal.title}
                </Text>
                <View style={styles.goalMeta}>
                  <View style={styles.dueChip}>
                    <CalendarChipIcon size={9} color={C.inkMuted} />
                    <Text style={styles.dueText}>{formatDueShort(due)}</Text>
                  </View>
                  {hasActions ? (
                    <>
                      <PaceBadge gap={gap} />
                      <Text style={styles.goalSub}>
                        {tpl(kk.goal.actionCount, { done, total })}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.goalSub}>{kk.goal.noActions}</Text>
                  )}
                </View>
              </View>
            </Pressable>

            <View style={styles.headActions}>
              <Pressable
                onPress={() => setConfirmDelete(true)}
                hitSlop={10}
                style={styles.trashBtn}
                accessibilityRole="button"
                accessibilityLabel={kk.goal.delete}
              >
                <TrashIcon size={16} color={C.ink4} />
              </Pressable>

              <Pressable
                onPress={onToggle}
                hitSlop={10}
                style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
                accessibilityRole="button"
                accessibilityLabel={open ? 'Жабу' : 'Ашу'}
              >
                <ChevronRightIcon size={16} color={C.inkIcon} />
              </Pressable>
            </View>
          </View>

          {open && (
            <View style={styles.expanded}>
              <SectionLabel style={{ marginBottom: 9 }}>{kk.goal.months}</SectionLabel>

              {months.map((m) => {
                const st = (monthStats ?? []).find((s) => s.goal.id === m.id);
                const mTotal = st?.total ?? 0;
                const mPct = st?.actual ?? 0;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => router.push(`/month/${m.id}` as never)}
                    style={styles.monthRow}
                    accessibilityRole="button"
                  >
                    <Text style={styles.monthName}>{m.title}</Text>
                    <View style={{ flexGrow: 1 }}>
                      <ProgressBar
                        pct={mPct}
                        color={mTotal === 0 ? C.lineField : color}
                        height={4}
                      />
                    </View>
                    <Text style={[styles.monthPct, mTotal === 0 && { color: C.ink4 }]}>
                      {mTotal === 0 ? '—' : `${mPct}%`}
                    </Text>
                  </Pressable>
                );
              })}

              <View style={styles.expandedFoot}>
                <Pressable
                  onPress={() => setConfirmDelete(true)}
                  style={styles.deleteLink}
                  accessibilityRole="button"
                  accessibilityLabel={kk.goal.delete}
                >
                  <TrashIcon size={13} color={C.ink3} />
                  <Text style={styles.deleteLinkText}>{kk.goal.delete}</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push(`/goal/${goal.id}` as never)}
                  style={styles.more}
                  accessibilityRole="button"
                >
                  <Text style={styles.moreText}>{kk.year.more}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  goalCard: { paddingHorizontal: 16, paddingVertical: 15 },
  goalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  goalMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  goalTitle: { fontFamily: font.title, fontSize: 13.5, letterSpacing: -0.14, color: C.ink },
  goalMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  dueChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.trackChip, borderRadius: R.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  dueText: { fontFamily: font.bold, fontSize: 10, color: C.inkBody },
  goalSub: { fontFamily: font.title, fontSize: 10, color: C.inkFaint },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trashBtn: {
    width: 32, height: 32, borderRadius: R.micro,
    alignItems: 'center', justifyContent: 'center',
  },

  expanded: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.trackChip },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  monthName: { fontFamily: font.body, fontSize: 11.5, color: C.inkBody, width: 96 },
  monthPct: { fontFamily: font.bold, fontSize: 11, color: C.ink, width: 40, textAlign: 'right' },
  expandedFoot: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 11,
  },
  deleteLink: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  deleteLinkText: { fontFamily: font.bold, fontSize: 11, color: C.ink3 },
  more: { paddingVertical: 4 },
  moreText: { fontFamily: font.bold, fontSize: 11, color: C.accent },

  confirmBox: { paddingVertical: 6, gap: 12 },
  confirmPrompt: { fontFamily: font.body, fontSize: 13, color: C.ink, lineHeight: 18 },
  confirmActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: R.tiny,
  },
  confirmDeleteBtnText: { fontFamily: font.bold, fontSize: 12, color: '#FFFFFF' },
  confirmCancelBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: R.tiny, backgroundColor: C.trackChip,
  },
  confirmCancelBtnText: { fontFamily: font.bold, fontSize: 12, color: C.ink2 },
});
