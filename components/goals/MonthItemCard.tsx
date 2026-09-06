import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, formatDayMonth, t as tpl } from '../../i18n/kk';
import type { Goal } from '../../lib/database.types';
import type { NodeStats } from '../../lib/goals';
import { Card, ProgressBar } from '../ui';
import { ChevronRightIcon } from '../icons';

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function MonthItemCard({
  m,
  stat,
  today,
}: {
  m: Goal;
  stat?: NodeStats;
  today: Date;
}) {
  const total = stat?.total ?? 0;
  const done = stat?.done ?? 0;
  const pct = stat?.actual ?? 0;
  const current = m.period_start <= toIso(today) && m.period_end >= toIso(today);

  return (
    <Pressable
      onPress={() => router.push(`/month/${m.id}` as never)}
      accessibilityRole="button"
    >
      <Card level="cardSm" radius={R.cardSm} style={styles.monthCard}>
        <View style={styles.monthHead}>
          <View style={[styles.monthBadge, current && { backgroundColor: C.accent }]}>
            <Text style={[styles.monthBadgeText, current && { color: '#FFFFFF' }]}>
              {total > 0 ? pct : '—'}
            </Text>
          </View>

          <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
            <View style={styles.monthTitleRow}>
              <Text style={styles.monthTitle}>{m.title}</Text>
              {current && (
                <View style={styles.currentChip}>
                  <Text style={styles.currentText}>{kk.goal.current}</Text>
                </View>
              )}
            </View>
            <Text style={styles.monthRange}>
              {formatDayMonth(new Date(m.period_start + 'T00:00:00'))} —{' '}
              {formatDayMonth(new Date(m.period_end + 'T00:00:00'))}
            </Text>
          </View>

          <View style={styles.monthRight}>
            <Text style={[styles.monthCount, total === 0 && { color: C.ink4 }]}>
              {total === 0
                ? kk.goal.addAction
                : tpl(kk.goal.actionCount, { done, total })}
            </Text>
            <ChevronRightIcon size={15} color={C.inkIcon} />
          </View>
        </View>

        {total > 0 && (
          <ProgressBar
            pct={pct}
            color={current ? C.accent : C.accent5}
            height={4}
            style={{ marginTop: 10 }}
          />
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  monthCard: { paddingHorizontal: 15, paddingVertical: 13 },
  monthHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthBadge: {
    width: 36, height: 36, borderRadius: R.box,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.tintRing2, flexShrink: 0,
  },
  monthBadgeText: { fontFamily: font.bold, fontSize: 11, color: C.accentDeep },
  monthTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  monthTitle: { fontFamily: font.title, fontSize: 13.5, color: C.ink },
  monthRange: { fontFamily: font.body, fontSize: 10.5, color: C.inkMuted, marginTop: 3 },
  currentChip: {
    backgroundColor: C.tint, borderRadius: R.pill,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  currentText: { fontFamily: font.bold, fontSize: 9, letterSpacing: 0.54, color: C.accentDeep },
  monthRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  monthCount: { fontFamily: font.bold, fontSize: 11, color: C.accent },
});
