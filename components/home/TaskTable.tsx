/**
 * Панельдің төменгі кестесі — таңдалған күннің әрекеттері.
 *
 * Кең экранда әрекеттер тізім емес, КЕСТЕ болып тұрады: әрекет · мақсат ·
 * уақыт · күй. Себебі панельде салыстыру керек, ал баған салыстыруға
 * ыңғайлы.
 *
 * ⚠ Күйді басу — орындау. Тізімдегі TaskRow сияқты, белгі қойылғанда
 * рефлексия ашылады (§7.4), белгі АЛЫНҒАНДА ашылмайды.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { color as C, radius as R, font } from '../../theme/tokens';
import { Card, SectionLabel, Checkbox } from '../ui';
import { PlayIcon } from '../icons';

export type TableRow = {
  id: string;
  title: string;
  time: string | null;
  done: boolean;
  goal: { title: string; color: string };
};

export function TaskTable({
  title,
  rows,
  columns,
  emptyText,
  noTimeText,
  doneText,
  openText,
  onToggle,
  onFocus,
  right,
}: {
  title: string;
  rows: TableRow[];
  /** [әрекет, мақсат, уақыт, күй] — тілдік файлдан келеді */
  columns: [string, string, string, string];
  emptyText: string;
  noTimeText: string;
  doneText: string;
  openText: string;
  onToggle: (row: TableRow) => void;
  /** Берілсе — орындалмаған жолда таймер түймесі шығады */
  onFocus?: (row: TableRow) => void;
  /** Тақырыптың оң жағындағы батырмалар */
  right?: React.ReactNode;
}) {
  return (
    <Card style={styles.root}>
      <View style={styles.head}>
        <SectionLabel>{title}</SectionLabel>
        <View style={{ flexGrow: 1 }} />
        {right}
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <>
          <View style={[styles.row, styles.headRow]}>
            <Text style={[styles.th, styles.colTitle]}>{columns[0]}</Text>
            <Text style={[styles.th, styles.colGoal]}>{columns[1]}</Text>
            <Text style={[styles.th, styles.colTime]}>{columns[2]}</Text>
            <Text style={[styles.th, styles.colState]}>{columns[3]}</Text>
          </View>

          {rows.map((r, i) => (
            <View key={r.id} style={[styles.row, i > 0 && styles.rowLine]}>
              <View style={[styles.colTitle, styles.cellRow]}>
                <Checkbox checked={r.done} onToggle={() => onToggle(r)} size={20} />
                <Text
                  style={[styles.title, r.done && styles.titleDone]}
                  numberOfLines={1}
                >
                  {r.title}
                </Text>
              </View>

              <View style={[styles.colGoal, styles.cellRow]}>
                <View style={[styles.dot, { backgroundColor: r.goal.color }]} />
                <Text style={styles.goal} numberOfLines={1}>
                  {r.goal.title}
                </Text>
              </View>

              <Text style={[styles.time, styles.colTime]} numberOfLines={1}>
                {r.time ?? noTimeText}
              </Text>

              <View style={[styles.colState, styles.cellRow]}>
                <Pressable
                  onPress={() => onToggle(r)}
                  style={[styles.badge, r.done && styles.badgeOn]}
                  accessibilityRole="button"
                  accessibilityState={{ checked: r.done }}
                >
                  <Text style={[styles.badgeText, r.done && styles.badgeTextOn]}>
                    {r.done ? doneText : openText}
                  </Text>
                </Pressable>

                {onFocus && !r.done && (
                  <Pressable
                    onPress={() => onFocus(r)}
                    style={styles.focus}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={r.title}
                  >
                    <PlayIcon size={10} color={C.accentDeep} />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { padding: 17 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  empty: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.ink4, marginTop: 12 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  headRow: { paddingTop: 14, paddingBottom: 6 },
  rowLine: { borderTopWidth: 1, borderTopColor: C.lineSoft },

  th: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.14,
    textTransform: 'uppercase',
    color: C.ink3,
  },

  // Баған енін бір жерден басқарамыз — өзгерту оңай болсын
  colTitle: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  colGoal: { width: 132, flexShrink: 0 },
  colTime: { width: 62, flexShrink: 0 },
  colState: { width: 142, flexShrink: 0, justifyContent: 'flex-start' },

  cellRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { fontFamily: font.title, fontSize: 13, color: C.ink, flexShrink: 1 },
  titleDone: { color: C.inkFaint, textDecorationLine: 'line-through' },
  dot: { width: 6, height: 6, borderRadius: 999, flexShrink: 0 },
  goal: { fontFamily: font.body, fontSize: 12, color: C.inkBody, flexShrink: 1 },
  time: { fontFamily: font.bold, fontSize: 12, color: C.inkMuted },

  badge: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: R.pill,
    backgroundColor: C.tintSoft,
    borderWidth: 1,
    borderColor: C.tintLine,
  },
  badgeOn: { backgroundColor: C.darkBg, borderColor: C.darkBg },
  badgeText: { fontFamily: font.bold, fontSize: 11, color: C.accentDeep },
  badgeTextOn: { color: '#FFFFFF' },
  focus: {
    width: 28, height: 28, borderRadius: R.pill, flexShrink: 0,
    backgroundColor: C.tintChip,
    alignItems: 'center', justifyContent: 'center',
  },
});
