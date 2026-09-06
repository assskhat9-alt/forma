import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import type { Goal } from '../../lib/database.types';
import { useCompleteGoal, useDeleteGoal } from '../../lib/goals';
import { goBack } from '../../lib/nav';
import { CheckIcon, TrashIcon } from '../icons';

export function GoalActions({
  goal,
  confirmDelete,
  setConfirmDelete,
}: {
  goal: Goal;
  confirmDelete: boolean;
  setConfirmDelete: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const complete = useCompleteGoal();
  const deleteGoal = useDeleteGoal();
  const [confirmDone, setConfirmDone] = useState(false);

  return (
    <>
      <Pressable
        onPress={() =>
          goal.status === 'done'
            ? complete.mutate({ id: goal.id, done: false })
            : confirmDone
              ? complete.mutate({ id: goal.id, done: true })
              : setConfirmDone(true)
        }
        disabled={complete.isPending}
        style={[styles.finish, goal.status === 'done' && styles.finishOn]}
        accessibilityRole="button"
      >
        <CheckIcon
          size={13}
          color={goal.status === 'done' ? C.accentDeep : C.ink3}
          strokeWidth={3}
        />
        <Text
          style={[styles.finishText, goal.status === 'done' && { color: C.accentDeep }]}
        >
          {goal.status === 'done'
            ? kk.goal.reopen
            : confirmDone
              ? kk.goal.finishConfirm
              : kk.goal.finish}
        </Text>
      </Pressable>

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
        disabled={deleteGoal.isPending}
        style={[styles.deleteBtn, confirmDelete && styles.deleteBtnConfirm]}
        accessibilityRole="button"
        accessibilityLabel={confirmDelete ? kk.goal.deleteConfirm : kk.goal.delete}
      >
        {deleteGoal.isPending ? (
          <ActivityIndicator color={confirmDelete ? '#FFFFFF' : C.ink3} size="small" />
        ) : (
          <>
            <TrashIcon
              size={14}
              color={confirmDelete ? '#FFFFFF' : C.ink3}
              strokeWidth={2.2}
            />
            <Text
              style={[styles.deleteBtnText, confirmDelete && { color: '#FFFFFF' }]}
            >
              {confirmDelete ? kk.goal.deleteConfirm : kk.goal.delete}
            </Text>
          </>
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  finish: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: R.sm, marginTop: 6,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line,
  },
  finishOn: { backgroundColor: C.tintSoft, borderColor: C.tintLine },
  finishText: { fontFamily: font.bold, fontSize: 12.5, color: C.ink3 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 44, borderRadius: R.sm, marginTop: 4,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.lineField,
  },
  deleteBtnConfirm: {
    backgroundColor: C.accent, borderColor: C.accent,
  },
  deleteBtnText: {
    fontFamily: font.bold, fontSize: 12.5, color: C.ink3,
  },
});
