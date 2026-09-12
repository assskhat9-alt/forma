import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { useAdminStats } from '../../lib/admin';
import { Card, SectionLabel, ProgressBar } from '../ui';
import { DiamondIcon, UserIcon, ClockIcon, CheckIcon } from '../icons';

export function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  const items = [
    {
      label: kk.admin.statsTotalUsers,
      value: String(stats.totalUsers),
      sub: `${stats.activeToday} ${kk.admin.statsActiveToday.toLowerCase()}`,
      Icon: UserIcon,
    },
    {
      label: kk.admin.statsGoals,
      value: String(stats.totalGoals),
      sub: `${stats.completionRate}% ${kk.admin.statsCompletion.toLowerCase()}`,
      Icon: DiamondIcon,
    },
    {
      label: kk.admin.statsHabits,
      value: String(stats.totalHabits),
      sub: kk.nav.habits,
      Icon: CheckIcon,
    },
    {
      label: kk.admin.statsFocus,
      value: `${Math.round(stats.totalFocusMinutes / 60)} сағ`,
      sub: `${stats.totalFocusMinutes} минут`,
      Icon: ClockIcon,
    },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.grid}>
        {items.map((it) => (
          <Card key={it.label} style={styles.statCard}>
            <View style={styles.cardHead}>
              <Text style={styles.statLabel}>{it.label}</Text>
              <View style={styles.iconBadge}>
                <it.Icon size={16} color={C.accent} />
              </View>
            </View>
            <Text style={styles.statValue}>{it.value}</Text>
            <Text style={styles.statSub}>{it.sub}</Text>
          </Card>
        ))}
      </View>

      <Card style={styles.progressCard}>
        <SectionLabel>{kk.admin.statsCompletion}</SectionLabel>
        <View style={styles.pctRow}>
          <Text style={styles.pctNumber}>{stats.completionRate}%</Text>
          <Text style={styles.pctHint}>Платформадағы барлық әрекеттердің нәтижесі</Text>
        </View>
        <ProgressBar pct={stats.completionRate} height={8} style={{ marginTop: 14 }} />
      </Card>

      <Card style={styles.systemCard}>
        <View style={styles.statusDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.systemTitle}>{kk.admin.systemHealthy}</Text>
          <Text style={styles.systemDesc}>{kk.admin.versionInfo}</Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 18 },
  center: { paddingVertical: 40, alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 240,
    padding: 18,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: R.sm,
    backgroundColor: C.tintRow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: font.title,
    fontSize: 12,
    color: C.ink3,
    letterSpacing: 0.3,
  },
  statValue: {
    fontFamily: font.display,
    fontSize: 28,
    color: C.ink,
    letterSpacing: -1,
  },
  statSub: {
    fontFamily: font.body,
    fontSize: 12,
    color: C.ink4,
    marginTop: 4,
  },
  progressCard: { padding: 20 },
  pctRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 8,
  },
  pctNumber: {
    fontFamily: font.display,
    fontSize: 32,
    color: C.accent,
    letterSpacing: -1,
  },
  pctHint: {
    fontFamily: font.body,
    fontSize: 13,
    color: C.inkMuted,
  },
  systemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: C.cardSoft,
    borderColor: C.line,
    borderWidth: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#10B981',
  },
  systemTitle: {
    fontFamily: font.bold,
    fontSize: 13,
    color: C.ink,
  },
  systemDesc: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: C.ink4,
    marginTop: 2,
  },
});
