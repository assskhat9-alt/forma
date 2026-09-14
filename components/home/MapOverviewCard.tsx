/**
 * Dropify 'Map Overview' стиліндегі апталық бағыт картасы.
 * Апта күндерінің траекториясы, маршрут сызығы, бақылау нүктелері мен масштабтау.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { color as C, radius as R, font } from '../../theme/tokens';
import { Card } from '../ui';
import { PlusIcon, ChevronRightIcon } from '../icons';

export function MapOverviewCard({
  title = 'Апталық бағыт картасы',
  startName = 'Бастау (Дс)',
  endName = 'Мәре (Жс)',
  progressMetric = '44,7 / 93,9 %',
  onExpand,
}: {
  title?: string;
  startName?: string;
  endName?: string;
  progressMetric?: string;
  onExpand?: () => void;
}) {
  return (
    <Card radius={22} style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* ── Карта/Маршрут сызбасы ── */}
      <View style={styles.mapArea}>
        <Svg width="100%" height={260} viewBox="0 0 240 260">
          {/* Картаның тор сызықтары */}
          <Line x1="20" y1="40" x2="220" y2="40" stroke="#F1F3F9" strokeWidth="1" />
          <Line x1="20" y1="100" x2="220" y2="100" stroke="#F1F3F9" strokeWidth="1" />
          <Line x1="20" y1="160" x2="220" y2="160" stroke="#F1F3F9" strokeWidth="1" />
          <Line x1="20" y1="220" x2="220" y2="220" stroke="#F1F3F9" strokeWidth="1" />
          <Line x1="60" y1="20" x2="60" y2="240" stroke="#F1F3F9" strokeWidth="1" />
          <Line x1="140" y1="20" x2="140" y2="240" stroke="#F1F3F9" strokeWidth="1" />

          {/* Маршрут қисығы (Dropify стилі) */}
          <Path
            d="M40 210 Q 70 180, 90 190 T 140 130 T 170 80 T 210 50"
            fill="none"
            stroke="#1A1D26"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Активті бөлік сызығы (күлгін) */}
          <Path
            d="M140 130 T 170 80"
            fill="none"
            stroke={C.accent}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Бастау нүктесі */}
          <Circle cx="40" cy="210" r="7" fill="#FFFFFF" stroke="#1A1D26" strokeWidth="3" />
          <Circle cx="40" cy="210" r="3" fill={C.accent} />

          {/* Ағымдағы орындалу меңзегіші */}
          <Circle cx="170" cy="80" r="8" fill={C.accent} />
          <Circle cx="170" cy="80" r="4" fill="#FFFFFF" />

          {/* Мәре нүктесі */}
          <Circle cx="210" cy="50" r="5" fill="#1A1D26" />
        </Svg>

        {/* Нүктелер жазбасы */}
        <View style={styles.pinStart}>
          <Text style={styles.pinText}>{startName}</Text>
        </View>

        <View style={styles.pinEnd}>
          <Text style={styles.pinText}>{endName}</Text>
        </View>

        {/* Оң жақ масштабтау батырмалары */}
        <View style={styles.zoomControls}>
          <Pressable style={styles.zoomBtn}>
            <PlusIcon size={12} color={C.ink2} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable style={styles.zoomBtn}>
            <Text style={styles.minusText}>–</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Төменгі көрсеткіш ── */}
      <View style={styles.footRow}>
        <Text style={styles.metricText}>{progressMetric}</Text>
        <Pressable onPress={onExpand} style={styles.expandBtn} accessibilityRole="button">
          <ChevronRightIcon size={16} color={C.ink3} strokeWidth={2} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
  },
  head: {
    marginBottom: 10,
  },
  title: {
    fontFamily: font.title,
    fontSize: 14,
    color: C.ink,
  },

  mapArea: {
    height: 260,
    backgroundColor: '#FAFBFD',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },

  pinStart: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  pinEnd: {
    position: 'absolute',
    top: 35,
    right: 25,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  pinText: {
    fontFamily: font.bold,
    fontSize: 10,
    color: C.ink,
  },

  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusText: {
    fontFamily: font.bold,
    fontSize: 14,
    color: C.ink2,
    lineHeight: 14,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#ECEEF2',
  },

  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  metricText: {
    fontFamily: font.display,
    fontSize: 18,
    letterSpacing: -0.4,
    color: C.ink,
  },
  expandBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
