import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, t } from '../../i18n/kk';
import { useAdminAnalytics } from '../../lib/analytics';
import { Card, SectionLabel, ProgressBar } from '../ui';
import { ClockIcon, ActivityIcon, DiamondIcon, UserIcon } from '../icons';

export function AdminAnalytics() {
  const { data: a, isLoading } = useAdminAnalytics();

  if (isLoading || !a) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  const hours = Math.floor(a.totalTodayMinutes / 60);
  const mins = a.totalTodayMinutes % 60;
  const totalTimeStr = `${hours} сағ ${mins} мин`;
  const focusHours = Math.floor(a.focusMinutes / 60);
  const focusMins = a.focusMinutes % 60;

  return (
    <View style={styles.root}>
      {/* ── 1. Live Онлайн пульсациялық блогы ── */}
      <Card style={styles.liveCard}>
        <View style={styles.liveHeader}>
          <View style={styles.pulseRow}>
            <View style={styles.pulseOuter}>
              <View style={styles.pulseDot} />
            </View>
            <Text style={styles.liveTitle}>{kk.admin.onlineNow}</Text>
          </View>
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineBadgeText}>
              {t(kk.admin.onlineCount, { n: a.onlineCount })}
            </Text>
          </View>
        </View>

        {/* Қазір онлайн отырғандардың чиптері */}
        <View style={styles.activeChipsRow}>
          {a.onlineUsers
            .filter((u) => u.isOnline)
            .map((u) => (
              <View key={u.id} style={styles.userChip}>
                <View style={styles.chipDot} />
                <Text style={styles.chipName}>{u.name}</Text>
                <Text style={styles.chipScreen}>· {u.currentScreen}</Text>
                <Text style={styles.chipTime}>({u.sessionMinutes} мин)</Text>
              </View>
            ))}
        </View>
      </Card>

      {/* ── 2. Негізгі уақыт метрикалары ── */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <View style={styles.metricHead}>
            <Text style={styles.metricLabel}>{kk.admin.totalTimeSpent}</Text>
            <View style={styles.iconCircle}>
              <ClockIcon size={16} color={C.accent} />
            </View>
          </View>
          <Text style={styles.metricValue}>{totalTimeStr}</Text>
          <Text style={styles.metricSub}>{kk.admin.todayTime}</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHead}>
            <Text style={styles.metricLabel}>{kk.admin.avgSessionDuration}</Text>
            <View style={styles.iconCircle}>
              <ActivityIcon size={16} color={C.accent} />
            </View>
          </View>
          <Text style={styles.metricValue}>{a.avgSessionMinutes} мин</Text>
          <Text style={styles.metricSub}>Бір кірудегі орташа уақыт</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHead}>
            <Text style={styles.metricLabel}>{kk.admin.focusProductiveTime}</Text>
            <View style={styles.iconCircle}>
              <DiamondIcon size={16} color={C.accent} />
            </View>
          </View>
          <Text style={styles.metricValue}>{focusHours} сағ {focusMins} мин</Text>
          <Text style={styles.metricSub}>{a.productivePct}% өнімді уақыт</Text>
        </Card>
      </View>

      {/* ── 3. Тәуліктік белсенді сағаттар бағандары ── */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHead}>
          <View>
            <SectionLabel>{kk.admin.peakHoursTitle}</SectionLabel>
            <Text style={styles.chartDesc}>{kk.admin.peakHoursDesc}</Text>
          </View>
          <View style={styles.peakHintBadge}>
            <Text style={styles.peakHintText}>Шыңы: 09:00 & 21:00</Text>
          </View>
        </View>

        <View style={styles.barsContainer}>
          {a.peakHours.map((ph) => (
            <View key={ph.hour} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${Math.max(12, ph.heightPct)}%` },
                    ph.isPeak && styles.barPeak,
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, ph.isPeak && styles.barLabelPeak]}>
                {ph.hour % 3 === 0 ? ph.label.slice(0, 2) : ''}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* ── 4. Бөлімдер бойынша уақыт үлесі ── */}
      <Card style={styles.sectionCard}>
        <SectionLabel>{kk.admin.sectionDistribution}</SectionLabel>
        <View style={styles.sectionList}>
          {a.sectionTimes.map((sec) => (
            <View key={sec.id} style={styles.secItem}>
              <View style={styles.secHeader}>
                <Text style={styles.secName}>{sec.name}</Text>
                <Text style={styles.secMins}>{sec.minutes} мин ({sec.pct}%)</Text>
              </View>
              <ProgressBar pct={sec.pct} height={6} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </Card>

      {/* ── 5. Қолданушылар бойынша белсенділік пен уақыт ── */}
      <Card style={styles.usersListCard}>
        <SectionLabel>{kk.admin.userActivityRanking}</SectionLabel>
        <View style={styles.usersTable}>
          {a.onlineUsers.map((u) => (
            <View key={u.id} style={styles.userRow}>
              <View style={[styles.statusDot, u.isOnline ? styles.dotOnline : styles.dotOffline]} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
              <View style={styles.userScreenWrap}>
                <Text style={styles.userScreen}>{u.currentScreen}</Text>
                <Text style={styles.userLastSeen}>{u.isOnline ? kk.admin.statusOnline : u.lastSeenText}</Text>
              </View>
              <View style={styles.userTimeWrap}>
                <Text style={styles.userTimeVal}>{u.todayMinutes} мин</Text>
                <Text style={styles.userTimeSub}>{kk.admin.todayTime}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  center: { paddingVertical: 40, alignItems: 'center' },

  liveCard: { padding: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.accentLine },
  liveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseOuter: {
    width: 16,
    height: 16,
    borderRadius: R.pill,
    backgroundColor: C.tintChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: { width: 8, height: 8, borderRadius: R.pill, backgroundColor: C.accentDeep },
  liveTitle: { fontFamily: font.bold, fontSize: 15, color: C.ink },
  onlineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    backgroundColor: C.tintSoft,
    borderWidth: 1,
    borderColor: C.accentLine,
  },
  onlineBadgeText: { fontFamily: font.bold, fontSize: 12, color: C.accentDeep },

  activeChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipDot: { width: 6, height: 6, borderRadius: R.pill, backgroundColor: C.accentDeep },
  chipName: { fontFamily: font.bold, fontSize: 12, color: C.ink },
  chipScreen: { fontFamily: font.prose, fontSize: 11.5, color: C.ink2 },
  chipTime: { fontFamily: font.body, fontSize: 11, color: C.ink3 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { flexGrow: 1, flexBasis: 200, padding: 16 },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontFamily: font.bold, fontSize: 12.5, color: C.ink3 },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: R.pill,
    backgroundColor: C.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { fontFamily: font.display, fontSize: 20, color: C.ink, marginTop: 8 },
  metricSub: { fontFamily: font.prose, fontSize: 11.5, color: C.inkMuted, marginTop: 2 },

  chartCard: { padding: 18 },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  chartDesc: { fontFamily: font.prose, fontSize: 12, color: C.inkMuted, marginTop: 2 },
  peakHintBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.micro,
    backgroundColor: C.tintChip,
  },
  peakHintText: { fontFamily: font.bold, fontSize: 11, color: C.accentDeep },

  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
    paddingTop: 10,
  },
  barCol: { flex: 1, height: '100%', alignItems: 'center' },
  barTrack: {
    width: '100%',
    flex: 1,
    backgroundColor: C.track,
    borderRadius: R.micro,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: C.accent4, borderRadius: R.micro },
  barPeak: { backgroundColor: C.accent },
  barLabel: { fontFamily: font.body, fontSize: 10, color: C.ink3, marginTop: 6 },
  barLabelPeak: { fontFamily: font.bold, color: C.accentDeep },

  sectionCard: { padding: 18 },
  sectionList: { gap: 14, marginTop: 12 },
  secItem: {},
  secHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  secName: { fontFamily: font.bold, fontSize: 13, color: C.ink },
  secMins: { fontFamily: font.body, fontSize: 12, color: C.ink3 },

  usersListCard: { padding: 18 },
  usersTable: { marginTop: 10, gap: 10 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    gap: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: R.pill },
  dotOnline: { backgroundColor: C.accentDeep },
  dotOffline: { backgroundColor: C.ink4 },
  userInfo: { flex: 2 },
  userName: { fontFamily: font.bold, fontSize: 13.5, color: C.ink },
  userEmail: { fontFamily: font.prose, fontSize: 11.5, color: C.ink3 },
  userScreenWrap: { flex: 1.5 },
  userScreen: { fontFamily: font.body, fontSize: 12, color: C.ink2 },
  userLastSeen: { fontFamily: font.prose, fontSize: 11, color: C.ink4 },
  userTimeWrap: { alignItems: 'flex-end', flex: 1 },
  userTimeVal: { fontFamily: font.bold, fontSize: 13, color: C.ink },
  userTimeSub: { fontFamily: font.prose, fontSize: 10.5, color: C.ink4 },
});
