/**
 * Dropify стиліндегі статистика карточкасы.
 * Қара дөңгелек белгіше + үлкен сан + өсім баджы + мини график.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { Card } from '../ui';
import type { IconProps } from '../icons';

export type Stat = {
  label: string;
  value: string;
  note?: string;
  badge?: string;
  badgeTone?: 'up' | 'down';
  href?: string;
  icon?: (p: IconProps) => React.ReactElement;
  chartType?: 'bars' | 'equalizer' | 'line';
  empty?: boolean;
};

export function StatCard({
  stat,
  onPress,
}: {
  stat: Stat;
  hero?: boolean;
  onPress?: () => void;
}) {
  const Icon = stat.icon;

  const inner = (
    <Card radius={22} style={styles.card}>
      <Text style={styles.label} numberOfLines={1}>
        {stat.label}
      </Text>

      <View style={styles.contentRow}>
        <View style={styles.valueGroup}>
          {Icon ? (
            <View style={styles.iconCircle}>
              <Icon size={16} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.value} numberOfLines={1}>
              {stat.value}
            </Text>
            {stat.badge ? (
              <Text
                style={[
                  styles.badge,
                  stat.badgeTone === 'down' ? styles.badgeDown : styles.badgeUp,
                ]}
              >
                {stat.badge}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Оң жақтағы мини-график ── */}
        <View style={styles.chartBox}>
          {stat.chartType === 'line' ? (
            <MiniLineChart empty={stat.empty} />
          ) : stat.chartType === 'equalizer' ? (
            <MiniEqualizerChart empty={stat.empty} />
          ) : (
            <MiniBarsChart empty={stat.empty} />
          )}
        </View>
      </View>

      {stat.note ? (
        <Text style={styles.note} numberOfLines={1}>
          {stat.note}
        </Text>
      ) : null}
    </Card>
  );

  if (!onPress) return <View style={styles.cell}>{inner}</View>;

  return (
    <Pressable style={styles.cell} onPress={onPress} accessibilityRole="link">
      {inner}
    </Pressable>
  );
}

function MiniBarsChart({ empty }: { empty?: boolean }) {
  const heights = empty ? [6, 6, 6, 6, 6] : [14, 22, 18, 30, 26];
  return (
    <View style={styles.chartRow}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.chartBar,
            {
              height: h,
              backgroundColor: empty ? '#E5E7EB' : (i === 3 ? C.accent : i === 4 ? C.accent2 : '#DDD6FE'),
            },
          ]}
        />
      ))}
    </View>
  );
}

function MiniEqualizerChart({ empty }: { empty?: boolean }) {
  const dots = empty ? [4, 4, 4, 4, 4, 4] : [12, 28, 16, 32, 20, 26];
  return (
    <View style={styles.chartRow}>
      {dots.map((h, i) => (
        <View key={i} style={styles.eqCol}>
          <View style={[styles.eqDot, { backgroundColor: empty ? '#E5E7EB' : (i % 2 === 0 ? C.accent : '#AA9EF7') }]} />
          <View style={[styles.eqLine, { height: h, backgroundColor: empty ? '#F3F4F6' : '#EDE9FE' }]} />
        </View>
      ))}
    </View>
  );
}

function MiniLineChart({ empty }: { empty?: boolean }) {
  if (empty) {
    return (
      <View style={styles.lineChart}>
        <View style={[styles.lineDot, { bottom: 6, left: 2, backgroundColor: '#E5E7EB' }]} />
        <View style={[styles.lineDot, { bottom: 6, left: 16, backgroundColor: '#E5E7EB' }]} />
        <View style={[styles.lineDot, { bottom: 6, left: 30, backgroundColor: '#E5E7EB' }]} />
        <View style={[styles.lineDot, { bottom: 6, left: 44, backgroundColor: '#E5E7EB' }]} />
        <View style={[styles.lineDot, { bottom: 6, left: 58, backgroundColor: '#E5E7EB' }]} />
      </View>
    );
  }
  return (
    <View style={styles.lineChart}>
      <View style={[styles.lineDot, { bottom: 6, left: 2 }]} />
      <View style={[styles.lineDot, { bottom: 18, left: 16 }]} />
      <View style={[styles.lineDot, { bottom: 12, left: 30 }]} />
      <View style={[styles.lineDot, { bottom: 26, left: 44 }]} />
      <View style={[styles.lineDotActive, { bottom: 20, left: 58 }]} />
      <View style={styles.linePath} />
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flexGrow: 1, flexShrink: 1, flexBasis: 220, minWidth: 200 },
  card: { padding: 18, backgroundColor: '#FFFFFF', borderRadius: 22 },

  label: {
    fontFamily: font.title,
    fontSize: 13,
    color: C.ink2,
    marginBottom: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1D26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: font.display,
    fontSize: 24,
    letterSpacing: -0.6,
    color: C.ink,
  },
  badge: {
    fontFamily: font.bold,
    fontSize: 10.5,
    marginLeft: 2,
  },
  badgeUp: { color: '#10B981' },
  badgeDown: { color: C.accent },

  chartBox: {
    height: 34,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 34,
  },
  chartBar: {
    width: 6,
    borderRadius: 3,
  },

  eqCol: {
    alignItems: 'center',
    gap: 3,
    justifyContent: 'flex-end',
  },
  eqDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eqLine: {
    width: 3,
    borderRadius: 1.5,
  },

  lineChart: {
    width: 66,
    height: 32,
    position: 'relative',
  },
  lineDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C6BEFB',
  },
  lineDotActive: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.accent,
  },
  linePath: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 12,
    height: 1.5,
    backgroundColor: '#EDE9FE',
  },

  note: {
    fontFamily: font.body,
    fontSize: 11,
    color: C.ink3,
    marginTop: 10,
  },
});
