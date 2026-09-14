/**
 * Апта қорытындысындағы тапсырмалардың интерактивті тізімі.
 * Барлығы / Орындалғандар / Қалып қойғандар сүзгілері және күн таңдауы.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { formatDayMonth } from '../../i18n/kk';
import type { WeekAction } from '../../lib/week';
import { Card, SectionLabel } from '../ui';
import { CheckIcon, ClockIcon } from '../icons';

type FilterType = 'all' | 'done' | 'missed';

export function WeekTasksView({
  actions,
  selectedDayIso,
  onMoveAction,
  onDropAction,
  movePending,
  dropPending,
}: {
  actions: WeekAction[];
  selectedDayIso: string | null;
  onMoveAction: (id: string, date: string) => void;
  onDropAction: (id: string) => void;
  movePending: boolean;
  dropPending: boolean;
}) {
  const [filter, setFilter] = useState<FilterType>('all');

  const dayFiltered = selectedDayIso
    ? actions.filter((a) => a.date === selectedDayIso)
    : actions;

  const doneCount = dayFiltered.filter((a) => a.status === 'done').length;
  const missedCount = dayFiltered.filter((a) => a.status === 'missed').length;
  const totalCount = dayFiltered.length;

  const displayed = dayFiltered.filter((a) => {
    if (filter === 'done') return a.status === 'done';
    if (filter === 'missed') return a.status === 'missed';
    return true;
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SectionLabel>Апта тапсырмалары</SectionLabel>
        <Text style={styles.counter}>{displayed.length} / {totalCount}</Text>
      </View>

      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[styles.tab, filter === 'all' && styles.tabActive]}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
            Барлығы ({totalCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('done')}
          style={[styles.tab, filter === 'done' && styles.tabActive]}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, filter === 'done' && styles.tabTextActive]}>
            Орындалды ({doneCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('missed')}
          style={[styles.tab, filter === 'missed' && styles.tabActive]}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, filter === 'missed' && styles.tabTextActive]}>
            Қалды ({missedCount})
          </Text>
        </Pressable>
      </View>

      {displayed.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {filter === 'done'
              ? 'Орындалған тапсырмалар әлі жоқ'
              : filter === 'missed'
              ? 'Қалып қойған тапсырмалар жоқ, бәрі тамаша!'
              : 'Бұл күні ешқандай тапсырма болмаған'}
          </Text>
        </Card>
      ) : (
        <Card style={styles.listCard}>
          {displayed.map((a, i) => {
            const isDone = a.status === 'done';
            const isMissed = a.status === 'missed';

            return (
              <View key={a.id} style={[styles.item, i > 0 && styles.itemBorder]}>
                <View
                  style={[
                    styles.statusBadge,
                    isDone && styles.statusBadgeDone,
                    isMissed && styles.statusBadgeMissed,
                  ]}
                >
                  {isDone ? (
                    <CheckIcon size={12} color={C.accent} strokeWidth={3} />
                  ) : (
                    <ClockIcon size={12} color={isMissed ? C.ink3 : C.ink4} strokeWidth={2.4} />
                  )}
                </View>

                <View style={styles.itemBody}>
                  <Text
                    style={[styles.itemTitle, isDone && styles.itemTitleDone]}
                    numberOfLines={2}
                  >
                    {a.title}
                  </Text>

                  <View style={styles.itemMeta}>
                    <Text style={styles.itemDate}>
                      {formatDayMonth(new Date(a.date + 'T00:00:00'))}
                    </Text>
                    {a.time ? <Text style={styles.itemTime}>• {a.time.slice(0, 5)}</Text> : null}
                    {a.goal && (
                      <View style={styles.goalChip}>
                        <View style={[styles.goalDot, { backgroundColor: a.goal.color }]} />
                        <Text style={styles.goalTitle} numberOfLines={1}>
                          {a.goal.title}
                        </Text>
                      </View>
                    )}
                  </View>

                  {isMissed && (
                    <View style={styles.actionBtns}>
                      <Pressable
                        onPress={() => onMoveAction(a.id, a.date)}
                        disabled={movePending}
                        style={[styles.btn, styles.btnMove]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.btnMoveText}>Келесі аптаға (+7 күн)</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onDropAction(a.id)}
                        disabled={dropPending}
                        style={styles.btn}
                        accessibilityRole="button"
                      >
                        <Text style={styles.btnText}>Жабу</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 4, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  counter: { fontFamily: font.bold, fontSize: 11.5, color: C.ink3 },
  tabsRow: { flexDirection: 'row', gap: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.chipSm, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  tabActive: { backgroundColor: C.tint, borderColor: C.accent },
  tabText: { fontFamily: font.bold, fontSize: 11, color: C.ink3 },
  tabTextActive: { color: C.accentDeep },
  emptyCard: { padding: 22, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: font.prose, fontSize: 12.5, color: C.ink4, textAlign: 'center' },
  listCard: { paddingHorizontal: 14, paddingVertical: 4 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  itemBorder: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  statusBadge: { width: 24, height: 24, borderRadius: 999, backgroundColor: C.cardSoft, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  statusBadgeDone: { backgroundColor: C.tint, borderColor: C.tintLine },
  statusBadgeMissed: { backgroundColor: C.cardSoft, borderColor: C.lineSoft },
  itemBody: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  itemTitle: { fontFamily: font.title, fontSize: 13, lineHeight: 18, color: C.ink },
  itemTitleDone: { color: C.ink3, textDecorationLine: 'line-through' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5, flexWrap: 'wrap' },
  itemDate: { fontFamily: font.body, fontSize: 11, color: C.ink4 },
  itemTime: { fontFamily: font.body, fontSize: 11, color: C.ink3 },
  goalChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.tint, borderRadius: R.pill, paddingHorizontal: 7, paddingVertical: 2, maxWidth: 160 },
  goalDot: { width: 6, height: 6, borderRadius: 999, flexShrink: 0 },
  goalTitle: { fontFamily: font.bold, fontSize: 9.5, color: C.accentDeep },
  actionBtns: { flexDirection: 'row', gap: 8, marginTop: 9 },
  btn: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: R.chipSm, backgroundColor: C.cardSoft, borderWidth: 1.5, borderColor: C.line },
  btnText: { fontFamily: font.bold, fontSize: 10.5, color: C.ink3 },
  btnMove: { backgroundColor: C.tintSoft, borderColor: C.tintLine },
  btnMoveText: { fontFamily: font.bold, fontSize: 10.5, color: C.accentDeep },
});
