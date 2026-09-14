/**
 * Апта қорытындысының басты көрсеткіштері (Hero card және 4 көрсеткіш плиткасы).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, t as tpl } from '../../i18n/kk';
import { fmtMinutes } from '../../lib/report';
import type { WeekReport } from '../../lib/week';
import { Card, DarkCard, SectionLabel } from '../ui';
import { CheckIcon, ClockIcon } from '../icons';

export function WeekHeroStats({
  rep,
  current,
}: {
  rep: WeekReport;
  current: boolean;
}) {
  const peak = Math.max(1, ...rep.trend.map((t) => t.pct));

  return (
    <View style={styles.root}>
      {/* Аптаның негізгі көрсеткіші */}
      <DarkCard style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>
              {current ? kk.week.thisWeek : kk.week.done}
            </Text>
            <View style={styles.bigRow}>
              <Text style={styles.big}>{rep.pct}%</Text>
              {rep.delta != null && rep.delta !== 0 && (
                <Text
                  style={[
                    styles.delta,
                    { color: rep.delta > 0 ? C.accent2 : C.darkInk3 },
                  ]}
                >
                  {rep.delta > 0 ? '+' : '−'}{Math.abs(rep.delta)}%
                </Text>
              )}
            </View>
            <Text style={styles.heroSub}>
              {rep.delta == null
                ? kk.week.noCompare
                : tpl(kk.week.prevWas, { pct: rep.prevPct })}
            </Text>
          </View>

          <View style={styles.trend}>
            {rep.trend.map((t) => (
              <View
                key={t.key}
                style={[
                  styles.trendBar,
                  { height: Math.max(Math.round((t.pct / peak) * 54), 4) },
                  t.current && { backgroundColor: C.accent },
                ]}
              />
            ))}
          </View>
        </View>
      </DarkCard>

      {/* 4 көрсеткіш плиткалары */}
      <View style={styles.tilesGrid}>
        <Card level="cardSm" radius={R.cardSm} style={styles.tile}>
          <View style={styles.tileHead}>
            <CheckIcon size={13} color={C.accent} strokeWidth={3.2} />
            <SectionLabel>{kk.week.done}</SectionLabel>
          </View>
          <Text style={styles.tileValue}>{rep.done}</Text>
        </Card>

        <Card level="cardSm" radius={R.cardSm} style={styles.tile}>
          <View style={styles.tileHead}>
            <ClockIcon size={13} color={C.ink3} strokeWidth={2.6} />
            <SectionLabel>{kk.week.missed}</SectionLabel>
          </View>
          <Text style={[styles.tileValue, { color: rep.missed.length > 0 ? C.ink : C.ink3 }]}>
            {rep.missed.length}
          </Text>
        </Card>

        <Card level="cardSm" radius={R.cardSm} style={styles.tile}>
          <View style={styles.tileHead}>
            <SectionLabel>{kk.week.focus}</SectionLabel>
          </View>
          <Text style={styles.tileValue}>
            {rep.focusMinutes > 0 ? fmtMinutes(rep.focusMinutes) : '—'}
          </Text>
        </Card>

        <Card level="cardSm" radius={R.cardSm} style={styles.tile}>
          <View style={styles.tileHead}>
            <SectionLabel>{kk.week.habits}</SectionLabel>
          </View>
          <Text style={styles.tileValue}>
            {rep.habitPlanned > 0 ? `${rep.habitDone}/${rep.habitPlanned}` : '—'}
          </Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  hero: { padding: 18 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  heroContent: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  heroLabel: { fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.14, textTransform: 'uppercase', color: C.accent2 },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 8 },
  big: { fontFamily: font.display, fontSize: 36, letterSpacing: -1.8, color: '#FFFFFF' },
  delta: { fontFamily: font.bold, fontSize: 12 },
  heroSub: { fontFamily: font.prose, fontSize: 11, color: C.darkInk2, marginTop: 6 },
  trend: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 54, flexShrink: 0 },
  trendBar: { width: 13, borderRadius: R.micro, backgroundColor: C.darkCard2 },

  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { flexGrow: 1, flexBasis: '47%', minWidth: 140, paddingHorizontal: 14, paddingVertical: 12 },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileValue: { fontFamily: font.display, fontSize: 20, letterSpacing: -0.8, color: C.ink, marginTop: 4 },
});
